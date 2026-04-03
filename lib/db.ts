import "server-only";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const dbPath = path.join(process.cwd(), "data", "shop.db");

import fs from "fs";
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

function getSeedImagePaths(slug: string) {
  return [
    { imagePath: `/products/${slug}.svg`, isThumbnail: 1, sortOrder: 0 },
    { imagePath: `/products/${slug}-2.svg`, isThumbnail: 0, sortOrder: 1 },
    { imagePath: `/products/${slug}-3.svg`, isThumbnail: 0, sortOrder: 2 }
  ];
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      catid INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      pid INTEGER PRIMARY KEY AUTOINCREMENT,
      catid INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      price TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      highlights TEXT,
      FOREIGN KEY (catid) REFERENCES categories(catid)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pid INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      is_thumbnail INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      userid INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      userid INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      userid INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      merchant_email TEXT NOT NULL,
      salt TEXT NOT NULL,
      digest TEXT NOT NULL,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userid) REFERENCES users(userid)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      pid INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_purchase REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
      FOREIGN KEY (pid) REFERENCES products(pid)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      stripe_payment_intent TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    )
  `);
}

function seedUsers() {
  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (email, password, name, is_admin) VALUES (?, ?, ?, ?)"
  );

  const defaultUsers = [
    { email: "admin@buddyforge.com", password: "Admin123!", name: "Admin", is_admin: 1 },
    { email: "user@buddyforge.com", password: "User123!", name: "Demo User", is_admin: 0 }
  ];

  for (const u of defaultUsers) {
    const hash = bcrypt.hashSync(u.password, 12);
    insertUser.run(u.email, hash, u.name, u.is_admin);
  }
}

export function seedDatabase() {
  try {
    seedUsers();

    const categories = [
      { name: "Bodies", products: [
        { name: "BlinkBuddy Body Shell", slug: "blinkbuddy-body", price: "$1200", tagline: "A friendly chassis with puppy eyes.", description: "A compact biped body built for kitchen banter and couch-side company, with soft joints and quiet motors.", highlights: "Height 1.4m|Mood ring LED|Self-cleaning vents" },
        { name: "CuddleCore Soft Shell", slug: "cuddlecore-soft-shell", price: "$980", tagline: "Hug-ready foam armor.", description: "A plush exterior with gentle compression sensors and a no-squeak movement kit for quiet movie marathons.", highlights: "Soft-touch foam|Whisper motors|Couch-safe bumpers" }
      ]},
      { name: "Personality Cores", products: [
        { name: "SnarkOS Personality Pack", slug: "snarkos-personality-pack", price: "$89", tagline: "Dry wit with safety rails.", description: "This personality core delivers playful sarcasm while keeping things kind, cozy, and PG.", highlights: "Snark slider|Context filters|Morning pep mode" },
        { name: "ZenFlow Voice Pack", slug: "zenflow-voice-pack", price: "$64", tagline: "Calm vocals for chaotic days.", description: "A soft, steady voice profile with breathing cues and guided focus prompts built in.", highlights: "Breath timer|Focus playlists|Night mode whispers" }
      ]},
      { name: "Skins", products: [
        { name: "HoloSkin Cat Ears", slug: "holoskin-cat-ears", price: "$45", tagline: "Project any vibe, including cat ears.", description: "A lightweight holographic overlay that snaps onto any compatible frame.", highlights: "Gesture swap|Glow outline|Pet-safe shimmer" },
        { name: "GlowCoat Spectrum Finish", slug: "glowcoat-spectrum-finish", price: "$72", tagline: "Color-shift shell with mood LEDs.", description: "A reactive coating that fades from sunrise peach to neon mint depending on the room.", highlights: "RGB sync|Heat-safe|Fingerprint resistant" }
      ]},
      { name: "Companion Kits", products: [
        { name: "Disco Drone Companion", slug: "disco-drone-companion", price: "$210", tagline: "A floating hype squad with speakers.", description: "A shoulder-height companion drone that dances, plays playlists, and carries snacks.", highlights: "360 speaker|Auto-dock|Confetti mode" },
        { name: "Aurora Tote Carry Dock", slug: "aurora-tote", price: "$118", tagline: "A travel cradle for your favorite build.", description: "A padded tote with charging passthrough, storage pockets, and a quick-snap dock for compact buddy modules.", highlights: "Shock-safe cradle|Cable pass-through|Accessory pockets" }
      ]},
      { name: "Upgrades", products: [
        { name: "ChefBot Arm Kit", slug: "chefbot-arm-kit", price: "$180", tagline: "Two extra arms for snack duty.", description: "Clip-on arms with spatula and whisk attachments for late-night ramen or pancake stacks.", highlights: "Quick-release joints|Dishwasher safe|Steam shield" },
        { name: "Mist Throw Cooling Wrap", slug: "mist-throw", price: "$96", tagline: "A thermal comfort upgrade for long sessions.", description: "A breathable wrap that regulates shell temperature and reduces motor heat buildup during all-night hangs.", highlights: "Cooling weave|Machine washable|Quick magnetic clasp" }
      ]}
    ];

    const getCategory = db.prepare("SELECT catid FROM categories WHERE name = ?");
    const getProduct = db.prepare("SELECT pid FROM products WHERE slug = ?");
    const getImageCount = db.prepare("SELECT COUNT(*) as count FROM product_images WHERE pid = ?");
    const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
    const insertProduct = db.prepare(`
      INSERT INTO products (catid, name, slug, price, tagline, description, highlights)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const updateProduct = db.prepare(`
      UPDATE products
      SET catid = ?, name = ?, price = ?, tagline = ?, description = ?, highlights = ?
      WHERE pid = ?
    `);
    const insertImage = db.prepare(`
      INSERT INTO product_images (pid, image_path, is_thumbnail, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    // Insert products
    for (const cat of categories) {
      const existingCategory = getCategory.get(cat.name) as { catid: number } | undefined;
      const catid = existingCategory
        ? existingCategory.catid
        : Number(insertCategory.run(cat.name).lastInsertRowid);

      for (const product of cat.products) {
        const existingProduct = getProduct.get(product.slug) as { pid: number } | undefined;
        let pid: number;

        if (existingProduct) {
          pid = existingProduct.pid;
          updateProduct.run(
            catid,
            product.name,
            product.price,
            product.tagline,
            product.description,
            product.highlights,
            pid
          );
        } else {
          const result = insertProduct.run(
            catid,
            product.name,
            product.slug,
            product.price,
            product.tagline,
            product.description,
            product.highlights
          );

          pid = Number(result.lastInsertRowid);
        }

        const imageCount = (getImageCount.get(pid) as { count: number }).count;
        if (imageCount > 0) {
          continue;
        }

        for (const image of getSeedImagePaths(product.slug)) {
          insertImage.run(pid, image.imagePath, image.isThumbnail, image.sortOrder);
        }
      }
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

// Initialize and seed on first import
initDatabase();
seedDatabase();

export default db;
