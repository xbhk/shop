"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

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

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Product form state
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
      const res = await fetch("/api/security/csrf", {
        cache: "no-store"
      });

      if (!res.ok) {
        throw new Error("Failed to initialize admin security context");
      }

      const data = await res.json();

      if (!data.csrfToken || typeof data.csrfToken !== "string") {
        throw new Error("Server did not return a valid CSRF token");
      }

      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error("Error creating secure admin session:", error);
      setCsrfToken(null);
    } finally {
      setSecurityLoading(false);
    }
  };

  const ensureSecurityContext = () => {
    if (csrfToken) {
      return true;
    }

    alert(
      securityLoading
        ? "Secure admin session is still initializing. Please retry in a moment."
        : "Secure admin session is unavailable. Refresh the page and try again."
    );

    return false;
  };

  const secureFetch = async (input: string, init: RequestInit = {}) => {
    if (!csrfToken) {
      throw new Error("Missing CSRF token");
    }

    const headers = new Headers(init.headers);
    headers.set("X-CSRF-Token", csrfToken);

    const response = await fetch(input, {
      ...init,
      headers,
      cache: "no-store"
    });

    if (response.status === 403) {
      await initializeSecurityContext();
    }

    return response;
  };

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const body = await response.json();
      if (body?.error && typeof body.error === "string") {
        return body.error;
      }
    } catch {
      // Ignore JSON parsing errors and fall back to the caller-provided message.
    }

    return fallback;
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products")
      ]);
      const cats = await catRes.json();
      const prods = await prodRes.json();
      setCategories(cats);
      setProducts(prods);
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

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to add category"));
      }

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

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to update category"));
      }

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

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to delete category"));
      }

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

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to add product"));
      }

      setProductForm({
        pid: 0,
        catid: "",
        name: "",
        slug: "",
        price: "",
        tagline: "",
        description: "",
        highlights: ""
      });
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
        body: JSON.stringify({
          ...editingProduct,
          highlights: editingProduct.highlights
        })
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to update product"));
      }

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

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to delete product"));
      }

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
      const res = await secureFetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Upload failed"));
      }

      setSelectedFile(null);
      setUploadPid(null);
      fetchData();
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

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
            <BreadcrumbPage>Admin Panel</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-3xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage categories and products</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Admin Access</Badge>
          <Badge variant={csrfToken ? "outline" : "secondary"}>
            {securityLoading
              ? "Securing Session"
              : csrfToken
                ? "Nonce Ready"
                : "Nonce Failed"}
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <Input
                  placeholder="Category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Add</Button>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.catid} className="flex items-center justify-between rounded-lg border p-3">
                    {editingCategory?.catid === category.catid ? (
                      <form onSubmit={handleUpdateCategory} className="flex flex-1 gap-2">
                        <Input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="flex-1"
                        />
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

          {/* Products Section */}
          <Card>
            <CardHeader>
              <CardTitle>Add Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="catid">Category</Label>
                  <Select value={productForm.catid} onValueChange={(v) => setProductForm({ ...productForm, catid: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.catid} value={cat.catid.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
                  <Input
                    id="slug"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    placeholder="e.g., my-product-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g., $99"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={productForm.tagline}
                    onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="highlights">Highlights (one per line)</Label>
                  <Textarea
                    id="highlights"
                    value={productForm.highlights}
                    onChange={(e) => setProductForm({ ...productForm, highlights: e.target.value })}
                    rows={3}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                </div>

                <Button type="submit" className="w-full">Add Product</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products List ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.pid} className="rounded-lg border p-4">
                {editingProduct?.pid === product.pid ? (
                  <form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={editingProduct.catid.toString()}
                          onValueChange={(v) => setEditingProduct({ ...editingProduct, catid: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.catid} value={cat.catid.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input
                          value={editingProduct.slug}
                          onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tagline</Label>
                      <Input
                        value={editingProduct.tagline}
                        onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Highlights (one per line)</Label>
                      <Textarea
                        value={editingProduct.highlights.join("\n")}
                        onChange={(e) => setEditingProduct({ ...editingProduct, highlights: e.target.value.split("\n").filter(Boolean) })}
                        rows={3}
                      />
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
                      {/* Image Upload Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setUploadPid(product.pid)}>Upload Image</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Product Image</DialogTitle>
                            <DialogDescription>
                              Upload an image for {product.name}. Max size: 10MB. Allowed formats: JPEG, PNG, GIF, WebP.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleImageUpload} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="image">Image File</Label>
                              <Input
                                id="image"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={!selectedFile}>Upload</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" onClick={() => startEditProduct(product)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.pid)}>Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
