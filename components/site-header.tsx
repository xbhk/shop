import Link from "next/link";
import { Cpu } from "lucide-react";

import { CartSheet } from "@/components/cart-sheet";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { categories } from "@/lib/products";
import { cn } from "@/lib/utils";

const shopLinks = categories.map((category) => ({
  title: category,
  href: "#",
  description: `Mix and match ${category.toLowerCase()} for your dream AI buddy.`
}));

export function SiteHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="container flex flex-wrap items-center justify-between gap-2 py-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span className="flex items-center gap-2">
          <Cpu className="h-3 w-3" />
          Firmware drop v3.2 - now with better jokes
        </span>
        <span>Free calibration over $200</span>
      </div>
      <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-semibold text-foreground">
            <span className="section-title">BuddyForge</span>
          </Link>
          <Badge variant="secondary" className="hidden md:inline-flex">
            Build Your AI Roommate
          </Badge>
        </div>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Shop Modules</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[420px] md:grid-cols-2">
                    {shopLinks.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "block rounded-md p-3 transition-colors hover:bg-accent",
                              "text-sm font-medium"
                            )}
                          >
                            <div>{item.title}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#" className={navigationMenuTriggerStyle()}>
                    Build Lab
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#" className={navigationMenuTriggerStyle()}>
                    Personality Forge
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <CartSheet />
        </nav>
      </div>
    </header>
  );
}
