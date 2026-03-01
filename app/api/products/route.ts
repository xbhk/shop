import { NextRequest, NextResponse } from "next/server";
import { getProductsByCategory, insertProduct, updateProduct, deleteProduct } from "@/lib/db-queries";

// GET /api/products - Get products (optionally filtered by category)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catid = searchParams.get("catid");

    const products = getProductsByCategory(catid ? parseInt(catid) : undefined);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { catid, name, slug, price, tagline, description, highlights } = body;

    // Validation
    if (!catid || !name || !slug || !price) {
      return NextResponse.json({ error: "catid, name, slug, and price are required" }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedData = {
      catid: parseInt(catid),
      name: name.trim().slice(0, 200),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 200),
      price: price.trim().slice(0, 50),
      tagline: (tagline || "").trim().slice(0, 500),
      description: (description || "").trim().slice(0, 2000),
      highlights: Array.isArray(highlights) ? highlights.map((h: string) => h.trim().slice(0, 200)).filter(Boolean) : []
    };

    const pid = insertProduct(sanitizedData);
    return NextResponse.json({ pid, ...sanitizedData }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT /api/products - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pid, catid, name, slug, price, tagline, description, highlights } = body;

    if (!pid) {
      return NextResponse.json({ error: "pid is required" }, { status: 400 });
    }

    const sanitizedData = {
      catid: parseInt(catid),
      name: name.trim().slice(0, 200),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 200),
      price: price.trim().slice(0, 50),
      tagline: (tagline || "").trim().slice(0, 500),
      description: (description || "").trim().slice(0, 2000),
      highlights: Array.isArray(highlights) ? highlights.map((h: string) => h.trim().slice(0, 200)).filter(Boolean) : []
    };

    const success = updateProduct(pid, sanitizedData);

    if (!success) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ pid, ...sanitizedData });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { pid } = body;

    if (!pid) {
      return NextResponse.json({ error: "pid is required" }, { status: 400 });
    }

    const success = deleteProduct(pid);

    if (!success) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
