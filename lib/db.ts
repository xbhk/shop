import "server-only";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "shop.db");

// Ensure data directory exists
import fs from "fs";
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
export function initDatabase() {
  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      catid INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Products table
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

  // Product images table
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
}

// Seed initial data
export function seedDatabase() {
  try {
    // Check if already seeded
    const count = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
    if (count.count > 0) return;

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
        { name: "Disco Drone Companion", slug: "disco-drone-companion", price: "$210", tagline: "A floating hype squad with speakers.", description: "A shoulder-height companion drone that dances, plays playlists, and carries snacks.", highlights: "360 speaker|Auto-dock|Confetti mode" }
      ]},
      { name: "Upgrades", products: [
        { name: "ChefBot Arm Kit", slug: "chefbot-arm-kit", price: "$180", tagline: "Two extra arms for snack duty.", description: "Clip-on arms with spatula and whisk attachments for late-night ramen or pancake stacks.", highlights: "Quick-release joints|Dishwasher safe|Steam shield" }
      ]}
    ];

    const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
    const insertProduct = db.prepare(`
      INSERT INTO products (catid, name, slug, price, tagline, description, highlights)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertImage = db.prepare(`
      INSERT INTO product_images (pid, image_path, is_thumbnail, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    const categoryIds: Record<string, number> = {};

    // Insert categories and get their IDs
    for (const cat of categories) {
      const result = insertCategory.run(cat.name);
      categoryIds[cat.name] = Number(result.lastInsertRowid);
    }

    // Insert products
    for (const cat of categories) {
      for (const product of cat.products) {
        const result = insertProduct.run(
          categoryIds[cat.name],
          product.name,
          product.slug,
          product.price,
          product.tagline,
          product.description,
          product.highlights
        );

        const pid = Number(result.lastInsertRowid);

        // Insert placeholder images
        const images = [
          "/products/snarkos-personality-pack.svg",
          "/products/snarkos-personality-pack-2.svg",
          "/products/snarkos-personality-pack-3.svg"
        ];

        images.forEach((img, idx) => {
          insertImage.run(pid, img, idx === 0 ? 1 : 0, idx);
        });
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
