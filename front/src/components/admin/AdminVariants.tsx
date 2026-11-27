"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Plus, Search, Power, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export interface VariantItem {
  id: string;
  sku: string;
  price: number;
  isActive: boolean;
  productId: string;
  productName: string;
  createdAt: string;
  attributes: Array<{ id: string; name: string; value: string; price?: number | null }>;
}

export interface ProductSimple {
  id: string;
  name: string;
}

export default function AdminVariants() {
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [products, setProducts] = useState<ProductSimple[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // New Variant Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newAttrName, setNewAttrName] = useState("Weight");
  const [newAttrValue, setNewAttrValue] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url =
        selectedProductId === "all"
          ? "/api/admin/variants"
          : `/api/admin/variants?productId=${selectedProductId}`;

      const [varRes, prodRes] = await Promise.all([
        fetch(url),
        fetch("/api/admin/products"),
      ]);

      if (varRes.ok) {
        const varData = await varRes.json();
        setVariants(varData.variants || []);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(
          (prodData.products || []).map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name,
          }))
        );
      }
    } catch {
      toast.error("Failed to load variants.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductId) {
      toast.error("Please select a product.");
      return;
    }

    try {
      const res = await fetch("/api/admin/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: targetProductId,
          sku: newSku,
          price: parseFloat(newPrice) || 0,
          attributeName: newAttrName,
          attributeValue: newAttrValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create variant");
      }

      toast.success("Variant created successfully.");
      setIsCreateOpen(false);
      setNewSku("");
      setNewPrice("");
      setNewAttrValue("");
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    }
  };

  const handleToggleActive = async (variant: VariantItem) => {
    const nextState = !variant.isActive;
    try {
      const res = await fetch("/api/admin/variants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variant.id, isActive: nextState }),
      });

      if (!res.ok) throw new Error("Update failed");

      setVariants((prev) =>
        prev.map((v) => (v.id === variant.id ? { ...v, isActive: nextState } : v))
      );
      toast.success(`Variant ${variant.sku} is now ${nextState ? "active" : "inactive"}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const filtered = variants.filter(
    (v) =>
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.productName.toLowerCase().includes(search.toLowerCase()) ||
      v.attributes.some((a) =>
        `${a.name} ${a.value}`.toLowerCase().includes(search.toLowerCase())
      )
  );

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
            placeholder="Search variants by SKU, product, or attribute (e.g. 500g)..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-medium text-text placeholder-text-muted/60 transition focus:border-primary focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (products.length > 0 && !targetProductId) {
                setTargetProductId(products[0].id);
              }
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark cursor-pointer"
          >
            <Plus className="h-4 w-4 text-accent" />
            <span>Add Variant</span>
          </button>
        </div>
      </div>

      {/* Variants Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              Product Variants & SKUs ({filtered.length})
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
            Loading variants...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No variants found matching criteria. Click &quot;Add Variant&quot; to configure pricing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">SKU Identifier</th>
                  <th className="px-5 py-3">Associated Product</th>
                  <th className="px-5 py-3">Attributes & Size</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filtered.map((v) => (
                  <tr key={v.id} className="transition hover:bg-background/50">
                    <td className="px-5 py-3.5 font-mono font-bold text-primary">{v.sku}</td>
                    <td className="px-5 py-3.5 font-medium text-text">{v.productName}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {v.attributes.map((a, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-text"
                          >
                            {a.name}: {a.value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-primary-dark tabular-nums">
                      UGX {v.price.toLocaleString("en-UG")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(v)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                          v.isActive
                            ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                            : "border-gray-300 bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Power className="h-2.5 w-2.5" />
                        <span>{v.isActive ? "Active" : "Inactive"}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[11px] text-text-muted font-mono select-all">
                        {v.id.slice(0, 8)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Variant Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">New Product Variant</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full p-1 text-text-muted hover:bg-background cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Select Product *</label>
                <select
                  required
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
                >
                  <option value="">Choose product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. TOM-500G"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-medium text-text focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">Price (UGX) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">Attribute Name</label>
                  <select
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
                  >
                    <option value="Weight">Weight</option>
                    <option value="Quantity">Quantity</option>
                    <option value="Unit">Unit</option>
                    <option value="Size">Size</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">Attribute Value</label>
                  <input
                    type="text"
                    value={newAttrValue}
                    onChange={(e) => setNewAttrValue(e.target.value)}
                    placeholder="e.g. 500 g or 1 bunch"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark cursor-pointer"
                >
                  Create Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
