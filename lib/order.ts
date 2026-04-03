import "server-only";

import crypto from "crypto";

export type OrderItemForDigest = {
  pid: number;
  quantity: number;
  price: number;
};

export function generateOrderDigest(
  currency: string,
  merchantEmail: string,
  salt: string,
  items: OrderItemForDigest[],
  totalPrice: number
): string {
  const sortedItems = [...items].sort((a, b) => a.pid - b.pid);
  const itemsPart = sortedItems
    .map((i) => `${i.pid}:${i.quantity}:${i.price.toFixed(2)}`)
    .join("|");

  const payload = [
    currency,
    merchantEmail,
    salt,
    itemsPart,
    totalPrice.toFixed(2)
  ].join("||");

  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^0-9.]/g, ""));
}
