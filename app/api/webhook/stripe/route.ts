import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  getOrderByStripeSession,
  getOrderItems,
  transactionExists,
  createTransaction,
  updateOrderStatus
} from "@/lib/db-queries";
import { generateOrderDigest } from "@/lib/order";

export async function POST(request: NextRequest) {
  let event;

  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const order = getOrderByStripeSession(session.id);
      if (!order) {
        console.error("Order not found for session:", session.id);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (transactionExists(order.order_id)) {
        console.log("Transaction already processed for order:", order.order_id);
        return NextResponse.json({ received: true });
      }

      const items = getOrderItems(order.order_id);
      const regeneratedDigest = generateOrderDigest(
        order.currency,
        order.merchant_email,
        order.salt,
        items.map((i) => ({
          pid: i.pid,
          quantity: i.quantity,
          price: i.price_at_purchase
        })),
        order.total_price
      );

      if (regeneratedDigest !== order.digest) {
        console.error(
          "Digest mismatch for order:",
          order.order_id,
          "expected:",
          order.digest,
          "got:",
          regeneratedDigest
        );
        updateOrderStatus(order.order_id, "failed");
        return NextResponse.json({ error: "Order integrity check failed" }, { status: 400 });
      }

      createTransaction({
        orderId: order.order_id,
        stripePaymentIntent: session.payment_intent || "",
        amount: (session.amount_total || 0) / 100,
        status: "completed"
      });

      updateOrderStatus(order.order_id, "paid");

      console.log("Payment completed for order:", order.order_id);
    } catch (error) {
      console.error("Webhook processing error:", error);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
