import { NextRequest, NextResponse } from "next/server";
import { getCategories, insertCategory, updateCategory, deleteCategory } from "@/lib/db-queries";
import { requireAdminCsrf } from "@/lib/security";
import { getCurrentUserFromRequest } from "@/lib/auth";

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const csrfError = requireAdminCsrf(request);
    if (csrfError) return csrfError;
    const user = getCurrentUserFromRequest(request);
    if (!user?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    // Sanitize input
    const sanitizedName = name.trim().slice(0, 100);
    if (!sanitizedName) {
      return NextResponse.json({ error: "Category name cannot be empty" }, { status: 400 });
    }

    const catid = insertCategory(sanitizedName);
    return NextResponse.json({ catid, name: sanitizedName }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

// PUT /api/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    const csrfError = requireAdminCsrf(request);
    if (csrfError) return csrfError;
    const user = getCurrentUserFromRequest(request);
    if (!user?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const parsedCatid = Number(body.catid);
    const { name } = body;

    if (!Number.isInteger(parsedCatid) || parsedCatid <= 0 || !name) {
      return NextResponse.json({ error: "catid and name are required" }, { status: 400 });
    }

    const sanitizedName = name.trim().slice(0, 100);
    if (!sanitizedName) {
      return NextResponse.json({ error: "Category name cannot be empty" }, { status: 400 });
    }

    const success = updateCategory(parsedCatid, sanitizedName);

    if (!success) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ catid: parsedCatid, name: sanitizedName });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/categories - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const csrfError = requireAdminCsrf(request);
    if (csrfError) return csrfError;
    const user = getCurrentUserFromRequest(request);
    if (!user?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const parsedCatid = Number(body.catid);

    if (!Number.isInteger(parsedCatid) || parsedCatid <= 0) {
      return NextResponse.json({ error: "catid is required" }, { status: 400 });
    }

    const success = deleteCategory(parsedCatid);

    if (!success) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
