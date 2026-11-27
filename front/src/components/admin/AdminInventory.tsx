"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Boxes, Search, CheckCircle2, AlertTriangle, Power, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
  type: "product" | "variant";
}

export default function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, varRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/variants"),
      ]);

      const inventoryList: InventoryItem[] = [];

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        for (const p of prodData.products || []) {
          inventoryList.push({
            id: p.id,
            name: p.name,
            sku: p.slug,
            price: p.basePrice,
            isActive: p.isActive,
            type: "product",
          });
        }
      }

      if (varRes.ok) {
        const varData = await varRes.json();
        for (const v of varData.variants || []) {
          inventoryList.push({
            id: v.id,
            name: `${v.productName} (${v.attributes.map((a: { name: string; value: string }) => `${a.name}: ${a.value}`).join(" · ") || v.sku})`,
            sku: v.sku,
            price: v.price,
            isActive: v.isActive,
            type: "variant",
          });
        }
      }

      setItems(inventoryList);
    } catch {
      toast.error("Failed to load inventory.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleToggle = async (item: InventoryItem) => {
    const nextState = !item.isActive;
    try {
      const endpoint = item.type === "product" ? "/api/admin/products" : "/api/admin/variants";
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: nextState }),
      });

      if (!res.ok) throw new Error("Toggle failed");

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: nextState } : i))
      );
      toast.success(`${item.name} set to ${nextState ? "Available" : "Unavailable"}.`);
    } catch {
      toast.error("Failed to update availability.");
    }
  };

  const activeCount = items.filter((i) => i.isActive).length;
  const inactiveCount = items.filter((i) => !i.isActive).length;

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Tracked Catalog Items
          </span>
          <div className="mt-2 text-2xl font-bold text-primary tabular-nums">
            {items.length}
          </div>
          <p className="mt-1 text-xs text-text-muted">Products and priced variants</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              In Stock / Available
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {activeCount}
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Ready for customer ordering</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Out of Stock / Inactive
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
            {inactiveCount}
          </div>
          <p className="mt-1 text-xs text-amber-600 font-medium">Suppressed from storefront</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by title or SKU..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-medium text-text placeholder-text-muted/60 transition focus:border-primary focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-text hover:bg-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Inventory List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              Stock Availability Controls ({filtered.length})
            </span>
          </div>
          <span className="text-xs text-text-muted">Instant live availability sync</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-muted">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading stock status...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No items matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">Item / SKU</th>
                  <th className="px-5 py-3">Item Type</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-center">Availability Status</th>
                  <th className="px-5 py-3 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filtered.map((item) => (
                  <tr key={item.id} className="transition hover:bg-background/50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-primary">{item.name}</p>
                      <p className="font-mono text-[11px] text-text-muted">{item.sku}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase text-text-muted">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-primary-dark tabular-nums">
                      UGX {item.price.toLocaleString("en-UG")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.isActive
                            ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                            : "border-gray-300 bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.isActive ? "In Stock" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                          item.isActive
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        <Power className="h-3 w-3" />
                        <span>{item.isActive ? "Mark Out of Stock" : "Enable Stock"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
