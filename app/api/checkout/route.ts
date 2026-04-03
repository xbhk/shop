import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getProductByPid, createOrder } from "@/lib/db-queries";
import { stripe } from "@/lib/stripe";
import { generateOrderDigest, generateSalt, parsePrice } from "@/lib/order";
import { requireAdminCsrf } from "@/lib/security";

const CURRENCY = "USD";
const MERCHANT_EMAIL = process.env.MERCHANT_EMAIL || "shanshuilang0@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireAdminCsrf(request);
    if (csrfError) return csrfError;

    const user = getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Please log in to checkout" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body as {
      items: Array<{ pid: number; quantity: number }>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const validatedItems: Array<{
      pid: number;
      quantity: number;
      price: number;
      name: string;
    }> = [];

    for (const item of items) {
      if (
        !Number.isInteger(item.pid) ||
        item.pid <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          { error: `Invalid item: pid=${item.pid}, quantity=${item.quantity}` },
          { status: 400 }
        );
      }

      const product = getProductByPid(item.pid);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: pid=${item.pid}` },
          { status: 400 }
        );
      }

      const priceNum = parsePrice(product.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return NextResponse.json(
          { error: `Invalid price for product: ${product.name}` },
          { status: 400 }
        );
      }

      validatedItems.push({
        pid: item.pid,
        quantity: item.quantity,
        price: priceNum,
        name: product.name
      });
    }

    const totalPrice = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const salt = generateSalt();
    const digest = generateOrderDigest(
      CURRENCY,
      MERCHANT_EMAIL,
      salt,
      validatedItems.map((i) => ({ pid: i.pid, quantity: i.quantity, price: i.price })),
      totalPrice
    );

    const origin = request.headers.get("origin") || request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: validatedItems.map((item) => ({
        price_data: {
          currency: CURRENCY.toLowerCase(),
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      })),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        merchant_email: MERCHANT_EMAIL,
        currency: CURRENCY
      }
    });

    const orderId = createOrder({
      userid: user.userid,
      currency: CURRENCY,
      merchantEmail: MERCHANT_EMAIL,
      salt,
      digest,
      totalPrice,
      stripeSessionId: session.id,
      items: validatedItems.map((i) => ({
        pid: i.pid,
        quantity: i.quantity,
        price: i.price
      }))
    });

    return NextResponse.json({
      orderId,
      sessionUrl: session.url
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
