"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    localStorage.removeItem("buddyforge-cart");
    window.dispatchEvent(new Event("storage"));
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="section-title text-2xl font-semibold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. Your payment has been processed.
            </p>
          </div>

          {sessionId && (
            <div className="text-xs text-muted-foreground">
              <Badge variant="outline">Session: {sessionId.slice(0, 20)}...</Badge>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/account">
              <Button variant="outline">View My Orders</Button>
            </Link>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
