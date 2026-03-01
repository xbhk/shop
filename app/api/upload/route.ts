import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import { addProductImage } from "@/lib/db-queries";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

// POST /api/upload - Upload product image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pid = formData.get("pid") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!pid) {
      return NextResponse.json({ error: "Product ID (pid) is required" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" }, { status: 400 });
    }

    // Get file extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const thumbnailsDir = path.join(uploadsDir, "thumbnails");

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    if (!existsSync(thumbnailsDir)) {
      await mkdir(thumbnailsDir, { recursive: true });
    }

    // Generate filename based on pid
    const timestamp = Date.now();
    const fileName = `product-${pid}-${timestamp}.${ext}`;
    const thumbnailFileName = `product-${pid}-${timestamp}-thumb.${ext}`;

    const filePath = path.join(uploadsDir, fileName);
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFileName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save original image
    await writeFile(filePath, buffer);

    // Create thumbnail using sharp
    await sharp(buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: "cover",
        position: "center"
      })
      .toFile(thumbnailPath);

    // Save to database
    const imagePath = `/uploads/${fileName}`;
    const thumbnailDbPath = `/uploads/thumbnails/${thumbnailFileName}`;

    // Add main image (not thumbnail)
    addProductImage(parseInt(pid), imagePath, false);

    // Add thumbnail image
    addProductImage(parseInt(pid), thumbnailDbPath, true);

    return NextResponse.json({
      success: true,
      image: imagePath,
      thumbnail: thumbnailDbPath
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
