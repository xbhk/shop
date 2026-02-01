import { ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

const cartItems = [
  { name: "BlinkBuddy Body Shell", price: "$1200", qty: 1 },
  { name: "SnarkOS Personality Pack", price: "$89", qty: 1 },
  { name: "HoloSkin Cat Ears", price: "$45", qty: 2 }
];

export function CartSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingBag className="h-4 w-4" />
          Cart
          <Badge variant="secondary" className="ml-1">{cartItems.length}</Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Shopping List</SheetTitle>
          <SheetDescription>Mix bodies, personalities, and upgrades before checkout.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {cartItems.map((item) => {
            const inputId = `qty-${item.name.toLowerCase().replace(/\\s+/g, "-")}`;
            return (
            <div key={item.name} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.price}</p>
                </div>
                <div className="w-20">
                  <label className="sr-only" htmlFor={inputId}>Quantity</label>
                  <Input id={inputId} type="number" min={1} defaultValue={item.qty} />
                </div>
              </div>
            </div>
            );
          })}
        </div>
        <div className="mt-6 rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">$1379</span>
          </div>
          <Button className="mt-4 w-full">Checkout</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
