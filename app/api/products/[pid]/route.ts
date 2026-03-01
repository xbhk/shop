import { NextRequest, NextResponse } from "next/server";
import { getProductByPid, getProductBySlug } from "@/lib/db-queries";

// GET /api/products/[pid] - Get single product by pid or slug
export async function GET(
  request: NextRequest,
  { params }: { params: { pid: string } }
) {
  try {
    const { pid } = params;

    // Try to parse as number first
    const pidNum = parseInt(pid);

    let product;
    if (!isNaN(pidNum)) {
      product = getProductByPid(pidNum);
    } else {
      // If not a number, treat as slug
      product = getProductBySlug(pid);
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
