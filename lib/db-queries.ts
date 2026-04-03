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

// ─── User queries ───

export type DbUser = {
  userid: number;
  email: string;
  password: string;
  name: string;
  is_admin: number;
  created_at: string;
};

export function getUserByEmail(email: string): DbUser | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as DbUser | undefined;
}

export function getUserById(userid: number): DbUser | undefined {
  return db.prepare("SELECT * FROM users WHERE userid = ?").get(userid) as DbUser | undefined;
}

export function createUser(email: string, passwordHash: string, name: string): number {
  const result = db
    .prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)")
    .run(email, passwordHash, name);
  return Number(result.lastInsertRowid);
}

export function updateUserPassword(userid: number, passwordHash: string): boolean {
  const result = db
    .prepare("UPDATE users SET password = ? WHERE userid = ?")
    .run(passwordHash, userid);
  return result.changes > 0;
}

// ─── Order queries ───

export type DbOrder = {
  order_id: number;
  userid: number;
  currency: string;
  merchant_email: string;
  salt: string;
  digest: string;
  total_price: number;
  status: string;
  stripe_session_id: string | null;
  created_at: string;
};

export type DbOrderItem = {
  id: number;
  order_id: number;
  pid: number;
  quantity: number;
  price_at_purchase: number;
};

export function createOrder(data: {
  userid: number;
  currency: string;
  merchantEmail: string;
  salt: string;
  digest: string;
  totalPrice: number;
  stripeSessionId: string;
  items: Array<{ pid: number; quantity: number; price: number }>;
}): number {
  const insertOrder = db.prepare(`
    INSERT INTO orders (userid, currency, merchant_email, salt, digest, total_price, stripe_session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, pid, quantity, price_at_purchase)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const result = insertOrder.run(
      data.userid,
      data.currency,
      data.merchantEmail,
      data.salt,
      data.digest,
      data.totalPrice,
      data.stripeSessionId
    );
    const orderId = Number(result.lastInsertRowid);

    for (const item of data.items) {
      insertItem.run(orderId, item.pid, item.quantity, item.price);
    }

    return orderId;
  });

  return tx();
}

export function getOrderByStripeSession(stripeSessionId: string): DbOrder | undefined {
  return db
    .prepare("SELECT * FROM orders WHERE stripe_session_id = ?")
    .get(stripeSessionId) as DbOrder | undefined;
}

export function getOrderById(orderId: number): DbOrder | undefined {
  return db.prepare("SELECT * FROM orders WHERE order_id = ?").get(orderId) as DbOrder | undefined;
}

export function getOrderItems(orderId: number): DbOrderItem[] {
  return db
    .prepare("SELECT * FROM order_items WHERE order_id = ?")
    .all(orderId) as DbOrderItem[];
}

export function updateOrderStatus(orderId: number, status: string): boolean {
  const result = db
    .prepare("UPDATE orders SET status = ? WHERE order_id = ?")
    .run(status, orderId);
  return result.changes > 0;
}

export function transactionExists(orderId: number): boolean {
  const row = db
    .prepare("SELECT id FROM transactions WHERE order_id = ?")
    .get(orderId) as { id: number } | undefined;
  return !!row;
}

export function createTransaction(data: {
  orderId: number;
  stripePaymentIntent: string;
  amount: number;
  status: string;
}): void {
  db.prepare(
    "INSERT INTO transactions (order_id, stripe_payment_intent, amount, status) VALUES (?, ?, ?, ?)"
  ).run(data.orderId, data.stripePaymentIntent, data.amount, data.status);
}

// ─── Admin order listing ───

export type OrderWithItems = DbOrder & {
  items: Array<DbOrderItem & { product_name: string }>;
  user_email: string;
  user_name: string;
  transaction_status: string | null;
};

export function getAllOrders(): OrderWithItems[] {
  const orders = db
    .prepare(
      `SELECT o.*, u.email as user_email, u.name as user_name,
              t.status as transaction_status
       FROM orders o
       JOIN users u ON o.userid = u.userid
       LEFT JOIN transactions t ON o.order_id = t.order_id
       ORDER BY o.created_at DESC`
    )
    .all() as Array<DbOrder & { user_email: string; user_name: string; transaction_status: string | null }>;

  const getItems = db.prepare(
    `SELECT oi.*, p.name as product_name
     FROM order_items oi
     JOIN products p ON oi.pid = p.pid
     WHERE oi.order_id = ?`
  );

  return orders.map((order) => ({
    ...order,
    items: getItems.all(order.order_id) as Array<DbOrderItem & { product_name: string }>
  }));
}

// ─── Member order inquiry (last 5) ───

export function getUserOrders(userid: number, limit: number = 5): OrderWithItems[] {
  const orders = db
    .prepare(
      `SELECT o.*, u.email as user_email, u.name as user_name,
              t.status as transaction_status
       FROM orders o
       JOIN users u ON o.userid = u.userid
       LEFT JOIN transactions t ON o.order_id = t.order_id
       WHERE o.userid = ?
       ORDER BY o.created_at DESC
       LIMIT ?`
    )
    .all(userid, limit) as Array<DbOrder & { user_email: string; user_name: string; transaction_status: string | null }>;

  const getItems = db.prepare(
    `SELECT oi.*, p.name as product_name
     FROM order_items oi
     JOIN products p ON oi.pid = p.pid
     WHERE oi.order_id = ?`
  );

  return orders.map((order) => ({
    ...order,
    items: getItems.all(order.order_id) as Array<DbOrderItem & { product_name: string }>
  }));
}
