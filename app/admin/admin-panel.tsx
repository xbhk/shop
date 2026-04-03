"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Category = {
  catid: number;
  name: string;
};

type Product = {
  pid: number;
  catid: number;
  name: string;
  slug: string;
  price: string;
  tagline: string;
  description: string;
  highlights: string[];
  images: string[];
  category: string;
};

type OrderItem = {
  pid: number;
  quantity: number;
  price_at_purchase: number;
  product_name: string;
};

type Order = {
  order_id: number;
  userid: number;
  total_price: number;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string;
  transaction_status: string | null;
  items: OrderItem[];
};

export default function AdminPanel() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [productForm, setProductForm] = useState({
    pid: 0,
    catid: "",
    name: "",
    slug: "",
    price: "",
    tagline: "",
    description: "",
    highlights: ""
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPid, setUploadPid] = useState<number | null>(null);

  const initializeSecurityContext = async () => {
    setSecurityLoading(true);
    try {
      const res = await fetch("/api/security/csrf", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to initialize admin security context");
      const data = await res.json();
      if (!data.csrfToken || typeof data.csrfToken !== "string")
        throw new Error("Server did not return a valid CSRF token");
      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error("Error creating secure admin session:", error);
      setCsrfToken(null);
    } finally {
      setSecurityLoading(false);
    }
  };

  const ensureSecurityContext = () => {
    if (csrfToken) return true;
    alert(
      securityLoading
        ? "Secure admin session is still initializing. Please retry in a moment."
        : "Secure admin session is unavailable. Refresh the page and try again."
    );
    return false;
  };

  const secureFetch = async (input: string, init: RequestInit = {}) => {
    if (!csrfToken) throw new Error("Missing CSRF token");
    const headers = new Headers(init.headers);
    headers.set("X-CSRF-Token", csrfToken);
    const response = await fetch(input, { ...init, headers, cache: "no-store" });
    if (response.status === 403) await initializeSecurityContext();
    return response;
  };

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const body = await response.json();
      if (body?.error && typeof body.error === "string") return body.error;
    } catch {}
    return fallback;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, ordRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
        fetch("/api/admin/orders", { cache: "no-store" })
      ]);
      const cats = await catRes.json();
      const prods = await prodRes.json();
      const ords = ordRes.ok ? await ordRes.json() : [];
      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeSecurityContext();
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Category CRUD
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    if (!ensureSecurityContext()) return;
    try {
      const res = await secureFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName })
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to add category"));
      setCategoryName("");
      fetchData();
    } catch (error) {
      console.error("Error adding category:", error);
      alert(error instanceof Error ? error.message : "Failed to add category");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!ensureSecurityContext()) return;
    try {
      const res = await secureFetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory)
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update category"));
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      console.error("Error updating category:", error);
      alert(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  const handleDeleteCategory = async (catid: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    if (!ensureSecurityContext()) return;
    try {
      const res = await secureFetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catid })
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete category"));
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  // Product CRUD
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.catid || !productForm.name || !productForm.price) return;
    if (!ensureSecurityContext()) return;
    try {
      const slug = productForm.slug || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await secureFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          slug,
          highlights: productForm.highlights.split("\n").filter(Boolean)
        })
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to add product"));
      setProductForm({ pid: 0, catid: "", name: "", slug: "", price: "", tagline: "", description: "", highlights: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
      alert(error instanceof Error ? error.message : "Failed to add product");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!ensureSecurityContext()) return;
    try {
      const res = await secureFetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingProduct, highlights: editingProduct.highlights })
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update product"));
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      console.error("Error updating product:", error);
      alert(error instanceof Error ? error.message : "Failed to update product");
    }
  };

  const handleDeleteProduct = async (pid: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    if (!ensureSecurityContext()) return;
    try {
      const res = await secureFetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid })
      });
      if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete product"));
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error instanceof Error ? error.message : "Failed to delete product");
    }
  };

  // Image upload
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadPid) return;
    if (!ensureSecurityContext()) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("pid", uploadPid.toString());
    try {
      const res = await secureFetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await getErrorMessage(res, "Upload failed"));
      setSelectedFile(null);
      setUploadPid(null);
      fetchData();
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-3xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage categories, products, and orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={csrfToken ? "outline" : "secondary"}>
            {securityLoading ? "Securing Session" : csrfToken ? "Nonce Ready" : "Nonce Failed"}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "products" ? "default" : "outline"}
          onClick={() => setActiveTab("products")}
        >
          Products & Categories
        </Button>
        <Button
          variant={activeTab === "orders" ? "default" : "outline"}
          onClick={() => setActiveTab("orders")}
        >
          Orders ({orders.length})
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : activeTab === "products" ? (
        <>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <Input placeholder="Category name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="flex-1" />
                  <Button type="submit">Add</Button>
                </form>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.catid} className="flex items-center justify-between rounded-lg border p-3">
                      {editingCategory?.catid === category.catid ? (
                        <form onSubmit={handleUpdateCategory} className="flex flex-1 gap-2">
                          <Input value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="flex-1" />
                          <Button type="submit" size="sm">Save</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingCategory(null)}>Cancel</Button>
                        </form>
                      ) : (
                        <>
                          <span>{category.name}</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.catid)}>Delete</Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add Product</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catid">Category</Label>
                    <Select value={productForm.catid} onValueChange={(v) => setProductForm({ ...productForm, catid: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.catid} value={cat.catid.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
                    <Input id="slug" value={productForm.slug} onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })} placeholder="e.g., my-product-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input id="price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="e.g., $99" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" value={productForm.tagline} onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highlights">Highlights (one per line)</Label>
                    <Textarea id="highlights" value={productForm.highlights} onChange={(e) => setProductForm({ ...productForm, highlights: e.target.value })} rows={3} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" />
                  </div>
                  <Button type="submit" className="w-full">Add Product</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Products List ({products.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.pid} className="rounded-lg border p-4">
                    {editingProduct?.pid === product.pid ? (
                      <form onSubmit={handleUpdateProduct} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={editingProduct.catid.toString()} onValueChange={(v) => setEditingProduct({ ...editingProduct, catid: parseInt(v) })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.catid} value={cat.catid.toString()}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={editingProduct.slug} onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <Input value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Tagline</Label>
                          <Input value={editingProduct.tagline} onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Highlights (one per line)</Label>
                          <Textarea value={editingProduct.highlights.join("\n")} onChange={(e) => setEditingProduct({ ...editingProduct, highlights: e.target.value.split("\n").filter(Boolean) })} rows={3} />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Save Changes</Button>
                          <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge variant="secondary">{product.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{product.tagline}</p>
                          <p className="text-lg font-semibold mt-1">{product.price}</p>
                          <p className="text-xs text-muted-foreground mt-1">PID: {product.pid} | Slug: {product.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setUploadPid(product.pid)}>Upload Image</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Product Image</DialogTitle>
                                <DialogDescription>Upload an image for {product.name}. Max size: 10MB.</DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleImageUpload} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="image">Image File</Label>
                                  <Input id="image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                </div>
                                <DialogFooter>
                                  <Button type="submit" disabled={!selectedFile}>Upload</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.pid)}>Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Orders</CardTitle></CardHeader>
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
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-muted-foreground">
                          {order.user_name} ({order.user_email})
                        </span>
                        <Badge variant={order.status === "paid" ? "default" : order.status === "failed" ? "destructive" : "secondary"}>
                          {order.status}
                        </Badge>
                        {order.transaction_status && (
                          <Badge variant="outline">TX: {order.transaction_status}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.product_name} (PID:{item.pid}) x {item.quantity}</span>
                          <span className="text-muted-foreground">${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
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
      )}
    </div>
  );
}
