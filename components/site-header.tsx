import Link from "next/link";
import { Cpu, Settings, User, LogIn } from "lucide-react";

import { CartSheet } from "@/components/cart-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { getCategories } from "@/lib/db-queries";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export function SiteHeader() {
  const categories = getCategories();
  const user = getCurrentUser();

  const shopLinks = categories.map((category) => ({
    title: category.name,
    href: `/?catid=${category.catid}`,
    description: `Mix and match ${category.name.toLowerCase()} for your dream AI buddy.`
  }));

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
              {user?.is_admin ? (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/admin" className={navigationMenuTriggerStyle()}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null}
            </NavigationMenuList>
          </NavigationMenu>

          {user ? (
            <Link href="/account">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {user.name}
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}

          <CartSheet />
        </nav>
      </div>
    </header>
  );
}
