"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, MessageCircle, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export interface CustomerProfile {
  phone: string;
  name: string;
  shippingAddresses: string[];
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderStatus: string;
  recentOrderIds: string[];
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      toast.error("Failed to load customers.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.shippingAddresses.some((a) => a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Search Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone, or delivery location..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-medium text-text placeholder-text-muted/60 transition focus:border-primary focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={fetchCustomers}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-text hover:bg-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              Customer Directory ({filtered.length})
            </span>
          </div>
          <span className="text-xs text-text-muted">Aggregated from verified store orders</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-muted">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading customer profiles...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No customer records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">Customer Name</th>
                  <th className="px-5 py-3">Phone & WhatsApp</th>
                  <th className="px-5 py-3">Known Delivery Locations</th>
                  <th className="px-5 py-3 text-center">Orders</th>
                  <th className="px-5 py-3 text-right">Lifetime Spend</th>
                  <th className="px-5 py-3 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filtered.map((c, idx) => {
                  const cleanPhone = c.phone.replace(/\D/g, "");
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${c.name}, this is Fruitful Market UG! Thank you for ordering with us.`
                  )}`;
                  const lastDateStr = new Date(c.lastOrderDate).toLocaleDateString("en-UG", {
                    dateStyle: "medium",
                  });

                  return (
                    <tr key={idx} className="transition hover:bg-background/50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-primary">{c.name}</p>
                        <p className="text-[11px] text-text-muted">VIP Customer</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 font-mono">
                          <span>{c.phone}</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>Chat</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs text-text-muted">
                        {c.shippingAddresses.length > 0 ? (
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-fresh mt-0.5" />
                            <span className="truncate">{c.shippingAddresses[0]}</span>
                          </div>
                        ) : (
                          "No address recorded"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold tabular-nums">
                        <span className="rounded-full bg-background px-2.5 py-0.5 text-xs text-text">
                          {c.ordersCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-primary-dark tabular-nums">
                        UGX {c.totalSpent.toLocaleString("en-UG")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <p className="text-text-muted">{lastDateStr}</p>
                        <p className="text-[10px] font-bold uppercase text-primary">
                          {c.lastOrderStatus}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
