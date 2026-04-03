"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

type User = {
  userid: number;
  email: string;
  name: string;
  is_admin: number;
};

type OrderItem = {
  pid: number;
  quantity: number;
  price_at_purchase: number;
  product_name: string;
};

type Order = {
  order_id: number;
  total_price: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  transaction_status: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/security/csrf", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json())
    ])
      .then(([csrfData, meData]) => {
        setCsrfToken(csrfData.csrfToken);
        if (!meData.user) {
          router.push("/login");
          return;
        }
        setUser(meData.user);
        return fetch("/api/account/orders", { cache: "no-store" }).then((r) => r.json());
      })
      .then((ordersData) => {
        if (ordersData) setOrders(ordersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword !== confirmNewPassword) {
      setPwError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setPwError(data.error || "Failed to change password");
        return;
      }

      setPwSuccess("Password changed successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 2000);
    } catch {
      setPwError("Something went wrong");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My Account</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="section-title text-3xl font-semibold">My Account</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user.name} ({user.email})
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                  {pwSuccess}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" disabled={pwLoading || !csrfToken}>
                {pwLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={user.is_admin ? "default" : "secondary"}>
                {user.is_admin ? "Admin" : "Member"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders (Last 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.order_id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="font-semibold">Order #{order.order_id}</span>
                      <span className="text-sm text-muted-foreground ml-3">
                        {new Date(order.created_at + "Z").toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          order.status === "paid"
                            ? "default"
                            : order.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.product_name} x {item.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          ${(item.price_at_purchase * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2 font-semibold text-sm">
                    <span>Total</span>
                    <span>${order.total_price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
