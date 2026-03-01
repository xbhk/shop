export type Product = {
  pid: number;
  slug: string;
  name: string;
  catid: number;
  category: string;
  price: string;
  tagline: string;
  description: string;
  images: string[];
  highlights: string[];
};

export type Category = {
  catid: number;
  name: string;
};

export type CartItem = {
  pid: number;
  quantity: number;
};

// These are now imported from database - keeping types here for reference
// Database functions are in db-queries.ts
