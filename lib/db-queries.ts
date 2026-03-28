import "server-only";
import db from "./db";
import type { Product, Category } from "./products";

// Get all categories
export function getCategories(): Category[] {
  return db.prepare("SELECT catid, name FROM categories ORDER BY catid").all() as Category[];
}

// Get category by ID
export function getCategoryById(catid: number): Category | undefined {
  return db.prepare("SELECT catid, name FROM categories WHERE catid = ?").get(catid) as Category | undefined;
}

// Get products by category
export function getProductsByCategory(catid?: number): Product[] {
  let query: string;
  let params: number[] = [];

  if (catid) {
    query = `
      SELECT p.pid, p.catid, p.name, p.slug, p.price, p.tagline, p.description, p.highlights, c.name as category
      FROM products p
      JOIN categories c ON p.catid = c.catid
      WHERE p.catid = ?
      ORDER BY p.pid
    `;
    params = [catid];
  } else {
    query = `
      SELECT p.pid, p.catid, p.name, p.slug, p.price, p.tagline, p.description, p.highlights, c.name as category
      FROM products p
      JOIN categories c ON p.catid = c.catid
      ORDER BY p.pid
    `;
  }

  const products = db.prepare(query).all(...params) as Array<{
    pid: number;
    catid: number;
    name: string;
    slug: string;
    price: string;
    tagline: string;
    description: string;
    highlights: string;
    category: string;
  }>;

  return products.map((p) => {
    const images = getProductImages(p.pid);

    return {
      ...p,
      highlights: p.highlights ? p.highlights.split("|") : [],
      thumbnail: getProductThumbnail(p.pid) ?? images[0],
      images
    };
  });
}

// Get product by slug
export function getProductBySlug(slug: string): Product | undefined {
  const product = db.prepare(`
    SELECT p.pid, p.catid, p.name, p.slug, p.price, p.tagline, p.description, p.highlights, c.name as category
    FROM products p
    JOIN categories c ON p.catid = c.catid
    WHERE p.slug = ?
  `).get(slug) as {
    pid: number;
    catid: number;
    name: string;
    slug: string;
    price: string;
    tagline: string;
    description: string;
    highlights: string;
    category: string;
  } | undefined;

  if (!product) return undefined;

  const images = getProductImages(product.pid);

  return {
    ...product,
    highlights: product.highlights ? product.highlights.split("|") : [],
    thumbnail: getProductThumbnail(product.pid) ?? images[0],
    images
  };
}

// Get product by pid
export function getProductByPid(pid: number): Product | undefined {
  const product = db.prepare(`
    SELECT p.pid, p.catid, p.name, p.slug, p.price, p.tagline, p.description, p.highlights, c.name as category
    FROM products p
    JOIN categories c ON p.catid = c.catid
    WHERE p.pid = ?
  `).get(pid) as {
    pid: number;
    catid: number;
    name: string;
    slug: string;
    price: string;
    tagline: string;
    description: string;
    highlights: string;
    category: string;
  } | undefined;

  if (!product) return undefined;

  const images = getProductImages(product.pid);

  return {
    ...product,
    highlights: product.highlights ? product.highlights.split("|") : [],
    thumbnail: getProductThumbnail(product.pid) ?? images[0],
    images
  };
}

// Get product images
export function getProductImages(pid: number): string[] {
  const images = db.prepare(`
    SELECT image_path FROM product_images
    WHERE pid = ? AND is_thumbnail = 0
    ORDER BY sort_order
  `).all(pid) as Array<{ image_path: string }>;

  return images.map(img => img.image_path);
}

// Get thumbnail for product
export function getProductThumbnail(pid: number): string | undefined {
  const image = db.prepare(`
    SELECT image_path FROM product_images
    WHERE pid = ? AND is_thumbnail = 1
    ORDER BY sort_order
    LIMIT 1
  `).get(pid) as { image_path: string } | undefined;

  return image?.image_path;
}

// Insert category
export function insertCategory(name: string): number {
  const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
  const result = stmt.run(name);
  return Number(result.lastInsertRowid);
}

// Update category
export function updateCategory(catid: number, name: string): boolean {
  const stmt = db.prepare("UPDATE categories SET name = ? WHERE catid = ?");
  const result = stmt.run(name, catid);
  return result.changes > 0;
}

// Delete category
export function deleteCategory(catid: number): boolean {
  const category = db.prepare("SELECT catid FROM categories WHERE catid = ?").get(catid) as
    | { catid: number }
    | undefined;

  if (!category) {
    return false;
  }

  const deleteCategoryTransaction = db.transaction((categoryId: number) => {
    db.prepare("DELETE FROM products WHERE catid = ?").run(categoryId);
    db.prepare("DELETE FROM categories WHERE catid = ?").run(categoryId);
  });

  deleteCategoryTransaction(catid);
  return true;
}

// Insert product
export function insertProduct(data: {
  catid: number;
  name: string;
  slug: string;
  price: string;
  tagline: string;
  description: string;
  highlights: string[];
}): number {
  const stmt = db.prepare(`
    INSERT INTO products (catid, name, slug, price, tagline, description, highlights)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.catid,
    data.name,
    data.slug,
    data.price,
    data.tagline,
    data.description,
    data.highlights.join("|")
  );
  return Number(result.lastInsertRowid);
}

// Update product
export function updateProduct(pid: number, data: {
  catid: number;
  name: string;
  slug: string;
  price: string;
  tagline: string;
  description: string;
  highlights: string[];
}): boolean {
  const stmt = db.prepare(`
    UPDATE products SET catid = ?, name = ?, slug = ?, price = ?, tagline = ?, description = ?, highlights = ?
    WHERE pid = ?
  `);
  const result = stmt.run(
    data.catid,
    data.name,
    data.slug,
    data.price,
    data.tagline,
    data.description,
    data.highlights.join("|"),
    pid
  );
  return result.changes > 0;
}

// Delete product
export function deleteProduct(pid: number): boolean {
  const stmt = db.prepare("DELETE FROM products WHERE pid = ?");
  const result = stmt.run(pid);
  return result.changes > 0;
}

// Add product image
export function addProductImage(pid: number, imagePath: string, isThumbnail: boolean = false): void {
  // Get max sort order
  const maxOrder = db.prepare("SELECT MAX(sort_order) as max FROM product_images WHERE pid = ?").get(pid) as { max: number | null };
  const sortOrder = (maxOrder.max ?? -1) + 1;

  const stmt = db.prepare(`
    INSERT INTO product_images (pid, image_path, is_thumbnail, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(pid, imagePath, isThumbnail ? 1 : 0, sortOrder);
}

// Delete product image
export function deleteProductImage(pid: number, imagePath: string): boolean {
  const stmt = db.prepare("DELETE FROM product_images WHERE pid = ? AND image_path = ?");
  const result = stmt.run(pid, imagePath);
  return result.changes > 0;
}

// Get products info for cart (pid, name, price only)
export function getProductsForCart(pids: number[]): Array<{ pid: number; name: string; price: string }> {
  if (pids.length === 0) return [];

  const placeholders = pids.map(() => "?").join(",");
  const query = `SELECT pid, name, price FROM products WHERE pid IN (${placeholders})`;
  return db.prepare(query).all(...pids) as Array<{ pid: number; name: string; price: string }>;
}
