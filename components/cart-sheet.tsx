"use client";

import { useState, useEffect } from "react";
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
  const { items, removeItem, updateQuantity, clearCart, total, itemCount, isLoading } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ userid: number } | null>(null);

  useEffect(() => {
    fetch("/api/security/csrf", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => {});

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  const handleQuantityChange = (pid: number, value: string) => {
    const qty = parseInt(value) || 0;
    updateQuantity(pid, qty);
  };

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (items.length === 0) return;

    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            pid: item.pid,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        alert(data.error || "Checkout failed");
        return;
      }

      if (data.sessionUrl) {
        clearCart();
        window.location.href = data.sessionUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
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
              <Button
                className="mt-4 w-full"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading
                  ? "Processing..."
                  : !user
                    ? "Log in to Checkout"
                    : "Checkout with Stripe"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
