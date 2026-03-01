import { NextRequest, NextResponse } from "next/server";
import { getProductsForCart } from "@/lib/db-queries";

// POST /api/cart - Get product info for cart items
// Body: { pids: number[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pids } = body;

    if (!Array.isArray(pids) || pids.length === 0) {
      return NextResponse.json([]);
    }

    // Validate pids are numbers
    const validPids = pids.filter(pid => typeof pid === "number" && pid > 0);

    const products = getProductsForCart(validPids);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching cart products:", error);
    return NextResponse.json({ error: "Failed to fetch cart products" }, { status: 500 });
  }
}
