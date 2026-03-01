import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCategories, getProductsByCategory, getCategoryById } from "@/lib/db-queries";

export const dynamic = "force-dynamic";

export default function HomePage({
  searchParams
}: {
  searchParams: { catid?: string };
}) {
  const catid = searchParams.catid ? parseInt(searchParams.catid) : undefined;
  const categories = getCategories();
  const products = getProductsByCategory(catid);
  const currentCategory = catid ? getCategoryById(catid) : undefined;

  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {currentCategory && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentCategory.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {!currentCategory && (
              <BreadcrumbItem>
                <BreadcrumbPage>Buddy Store</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit">Build-a-bot drop</Badge>
            <h1 className="section-title text-4xl font-semibold md:text-5xl">
              Design the AI roommate you actually want to live with.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Pick a body, slap on a personality core, and add a few upgrades. No tiny talk,
              no dishes, just premium vibes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Start Building</Button>
              <Button variant="outline">Watch a demo</Button>
            </div>
          </div>
          {products.length > 0 && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={products[0]?.images[0] || "/products/snarkos-personality-pack.svg"}
                  alt={products[0]?.name || "Featured product"}
                  className="h-full w-full bg-gradient-to-br from-white via-secondary/40 to-accent/30 object-contain p-10"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/80">
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="section-title text-2xl font-semibold">Build Steps</h2>
              <p className="text-sm text-muted-foreground">
                From personality to hardware in under five minutes.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  step: "Step 1",
                  title: "Pick a body",
                  copy: "Tall, compact, or extra squishy. Each shell is modular."
                },
                {
                  step: "Step 2",
                  title: "Install a personality core",
                  copy: "Snarky, zen, or motivational. Swap anytime."
                },
                {
                  step: "Step 3",
                  title: "Add weird upgrades",
                  copy: "Drone friends, extra arms, or cat-ear skins."
                }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <Badge variant="outline" className="h-fit">{item.step}</Badge>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80">
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="section-title text-2xl font-semibold">Lab Notes</h2>
              <p className="text-sm text-muted-foreground">
                Compatibility tips from the BuddyForge engineers.
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Badge variant="secondary">Mood</Badge>
                <span>SnarkOS pairs best with soft shells to reduce sass impact.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary">Energy</Badge>
                <span>Disco Drone requires a 2m dance radius and a playlist.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary">Care</Badge>
                <span>GlowCoat likes shade. Direct sunlight equals dramatic glare.</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full">Run Compatibility Check</Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="section-title text-3xl font-semibold">
              {currentCategory ? currentCategory.name : "Featured Modules"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentCategory
                ? `Showing products in ${currentCategory.name}`
                : "Tableless layout using flex and grid cards. Click a module to view details."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Badge variant={!catid ? "default" : "outline"} className="cursor-pointer">
                All
              </Badge>
            </Link>
            {categories.map((category) => (
              <Link key={category.catid} href={`/?catid=${category.catid}`}>
                <Badge
                  variant={catid === category.catid ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.pid} product={product} />
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">
              No products found in this category.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Choose your vibe",
            copy: "Friendly, snarky, sleepy, or hyper-productive. Swap cores anytime."
          },
          {
            title: "Bodies that fit",
            copy: "Compact or tall, soft or sleek. Every shell is modular and repairable."
          },
          {
            title: "Upgrade the chaos",
            copy: "Add arms, drones, or skins to match your daily routine."
          }
        ].map((feature) => (
          <Card key={feature.title}>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.copy}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
