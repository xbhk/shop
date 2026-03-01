"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

export function AddToCartButton({ pid }: { pid: number }) {
  const { addItem } = useCart();

  return (
    <Button onClick={() => addItem(pid)}>Add to Cart</Button>
  );
}
