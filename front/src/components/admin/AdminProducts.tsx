"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  X,
  Edit2,
  Power,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  categories: Array<{ id: string; name: string; slug: string }>;
  variants: Array<{ id: string; sku: string; price: number; is_active: boolean }>;
  images: Array<{ id: string; url: string; alt_text?: string | null }>;
}

export interface AdminCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRef[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);

  // New Product Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVariantSku, setNewVariantSku] = useState("");

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch {
      toast.error("Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Product name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          basePrice: parseFloat(newBasePrice) || 0,
          categoryId: newCategoryId || undefined,
          description: newDescription,
          imageUrl: newImageUrl,
          variantSku: newVariantSku,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }

      toast.success(`${newName} added to catalog!`);
      setIsCreateModalOpen(false);
      setNewName("");
      setNewBasePrice("");
      setNewDescription("");
      setNewImageUrl("");
      setNewVariantSku("");
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: AdminProduct) => {
    const nextState = !product.isActive;
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isActive: nextState }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: nextState } : p))
      );
      toast.success(`${product.name} is now ${nextState ? "Active" : "Inactive"}.`);
    } catch {
      toast.error("Failed to toggle status.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editName,
          basePrice: parseFloat(editPrice) || 0,
          description: editDescription,
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      toast.success("Product updated.");
      setEditingProduct(null);
      fetchData();
    } catch {
      toast.error("Failed to update product.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || p.categories.some((c) => c.id === categoryFilter);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, slug, or variant SKU..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-medium text-text placeholder-text-muted/60 transition focus:border-primary focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark cursor-pointer"
          >
            <Plus className="h-4 w-4 text-accent" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              Catalog Items ({filteredProducts.length})
            </span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-muted">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading catalog products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No products match the selected criteria. Click &quot;Add Product&quot; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Base Price</th>
                  <th className="px-5 py-3 text-center">Variants</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredProducts.map((p) => {
                  const image = p.images[0]?.url;

                  return (
                    <tr key={p.id} className="transition hover:bg-background/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border">
                              <Image src={image} alt={p.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-xs font-bold text-text-muted">
                              PKG
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-primary">{p.name}</p>
                            <p className="font-mono text-[11px] text-text-muted">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {p.categories.map((c) => (
                            <span
                              key={c.id}
                              className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-text"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-primary-dark tabular-nums">
                        UGX {p.basePrice.toLocaleString("en-UG")}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold tabular-nums">
                        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-text">
                          {p.variants.length} SKU{p.variants.length === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                            p.isActive
                              ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                              : "border-gray-300 bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Power className="h-2.5 w-2.5" />
                          <span>{p.isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p.id}`}
                            target="_blank"
                            title="View storefront page"
                            className="rounded-lg p-1 text-text-muted hover:text-primary transition"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setEditName(p.name);
                              setEditPrice(String(p.basePrice));
                              setEditDescription(p.description || "");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary shadow-2xs hover:bg-background cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">Add New Product</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full p-1 text-text-muted hover:bg-background cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Organic Ugandan Honey"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">Base Price (UGX) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">Category</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Initial SKU (optional)</label>
                <input
                  type="text"
                  value={newVariantSku}
                  onChange={(e) => setNewVariantSku(e.target.value)}
                  placeholder="e.g. HONEY-500G"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Image URL (Unsplash or Cloudflare)</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Fresh organic description..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">Edit Product</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-full p-1 text-text-muted hover:bg-background cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Base Price (UGX)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={100}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark cursor-pointer"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
