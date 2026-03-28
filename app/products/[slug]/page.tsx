import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProductBySlug } from "@/lib/db-queries";
import { AddToCartButton } from "@/components/add-to-cart-button";

export const dynamic = "force-dynamic";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const galleryImages = product.images.length > 0
    ? product.images
    : [product.thumbnail || "/products/snarkos-personality-pack.svg"];
  const mainImage = galleryImages[0];

  return (
    <div className="space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/?catid=${product.catid}`}>{product.category}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={mainImage}
                alt={product.name}
                className="h-[420px] w-full bg-gradient-to-br from-white via-secondary/40 to-accent/30 object-contain p-12"
              />
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-3">
            {galleryImages.slice(0, 3).map((image, index) => (
              <Card key={image} className={index === 0 ? "border-primary" : ""}>
                <CardContent className="p-0">
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="h-24 w-full bg-gradient-to-br from-white via-secondary/40 to-accent/30 object-contain p-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Badge variant="secondary" className="w-fit">{product.category}</Badge>
          <div className="space-y-3">
            <h1 className="section-title text-3xl font-semibold md:text-4xl">{product.name}</h1>
            <p className="text-base text-muted-foreground">{product.description}</p>
          </div>
          <div className="text-2xl font-semibold">{product.price}</div>
          <div className="flex flex-wrap gap-3">
            <AddToCartButton pid={product.pid} />
            <Button variant="outline">Save for later</Button>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {product.highlights.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>Ships in 2-3 business days. Firmware updates included for 30 days.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
