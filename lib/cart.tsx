"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CartItem = {
  pid: number;
  quantity: number;
};

type CartItemWithProduct = CartItem & {
  name: string;
  price: string;
};

const LOADING_CART_PRICE = "$0.00";
const LOADING_CART_NAME = "Loading product...";

type CartContextType = {
  items: CartItemWithProduct[];
  addItem: (pid: number) => void;
  removeItem: (pid: number) => void;
  updateQuantity: (pid: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "buddyforge-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const cartItems: CartItem[] = JSON.parse(stored);
        if (cartItems.length > 0) {
          fetchCartProducts(cartItems);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cart from localStorage:", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch product details for cart items
  const fetchCartProducts = async (cartItems: CartItem[]) => {
    try {
      const pids = cartItems.map((item) => item.pid);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pids })
      });

      if (res.ok) {
        const products: Array<{ pid: number; name: string; price: string }> = await res.json();

        const itemsWithProducts: CartItemWithProduct[] = cartItems
          .map((cartItem) => {
            const product = products.find((p) => p.pid === cartItem.pid);
            if (product) {
              return {
                ...cartItem,
                name: product.name,
                price: product.price
              };
            }
            return null;
          })
          .filter((item): item is CartItemWithProduct => item !== null);

        setItems(itemsWithProducts);
      }
    } catch (error) {
      console.error("Failed to fetch cart products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!isLoading) {
      const cartItems: CartItem[] = items.map((item) => ({
        pid: item.pid,
        quantity: item.quantity
      }));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [items, isLoading]);

  // Listen for addToCart events from ProductCard
  useEffect(() => {
    const handleAddToCart = (event: CustomEvent<{ pid: number }>) => {
      addItem(event.detail.pid);
    };

    window.addEventListener("addToCart", handleAddToCart as EventListener);
    return () => window.removeEventListener("addToCart", handleAddToCart as EventListener);
  }, []);

  const addItem = (pid: number) => {
    let shouldFetch = false;

    setItems((prev) => {
      const existing = prev.find((item) => item.pid === pid);
      if (existing) {
        return prev.map((item) =>
          item.pid === pid ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      shouldFetch = true;
      return [
        ...prev,
        {
          pid,
          quantity: 1,
          name: LOADING_CART_NAME,
          price: LOADING_CART_PRICE
        }
      ];
    });

    if (!shouldFetch) {
      return;
    }

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pids: [pid] })
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch product info for cart");
        }

        const products: Array<{ pid: number; name: string; price: string }> = await res.json();
        const product = products[0];

        setItems((current) => {
          if (!product) {
            return current.filter((item) => item.pid !== pid);
          }

          return current.map((item) =>
            item.pid === pid
              ? { ...item, name: product.name, price: product.price }
              : item
          );
        });
      })
      .catch((error) => {
        console.error(error);
        setItems((current) => current.filter((item) => item.pid !== pid));
      });
  };

  const removeItem = (pid: number) => {
    setItems((prev) => prev.filter((item) => item.pid !== pid));
  };

  const updateQuantity = (pid: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(pid);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.pid === pid ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const total = items.reduce((sum, item) => {
    const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    return sum + priceNum * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

// Helper to parse price string to number
export function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^0-9.]/g, ""));
}
