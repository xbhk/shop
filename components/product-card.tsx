import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-0">
        <Link
          href={`/products/${product.slug}`}
          className="block overflow-hidden bg-gradient-to-br from-white via-secondary/40 to-accent/30"
        >
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-56 w-full object-contain p-6 transition duration-300 group-hover:scale-105"
          />
        </Link>
      </CardContent>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/products/${product.slug}`} className="block text-lg font-semibold">
              {product.name}
            </Link>
            <p className="text-sm text-muted-foreground">{product.tagline}</p>
          </div>
          <Badge variant="secondary">{product.category}</Badge>
        </div>
        <div className="text-base font-semibold">{product.price}</div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  );
}
