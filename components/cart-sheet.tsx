"use client";

import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react";

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
import { useCart } from "@/lib/cart";

export function CartSheet() {
  const { items, removeItem, updateQuantity, total, itemCount, isLoading } = useCart();

  const handleQuantityChange = (pid: number, value: string) => {
    const qty = parseInt(value) || 0;
    updateQuantity(pid, qty);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingBag className="h-4 w-4" />
          Cart
          {itemCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Shopping List</SheetTitle>
          <SheetDescription>Mix bodies, personalities, and upgrades before checkout.</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="mt-6 text-center text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="mt-6 text-center text-muted-foreground">
            Your cart is empty. Add some products to get started!
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {items.map((item) => {
                const inputId = `qty-${item.pid}`;
                const itemTotal = parseFloat(item.price.replace(/[^0-9.]/g, "")) * item.quantity;
                return (
                  <div key={item.pid} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.price} x {item.quantity} = ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.pid, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          id={inputId}
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.pid, e.target.value)}
                          className="h-8 w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.pid, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.pid)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              <Button className="mt-4 w-full">Checkout</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
