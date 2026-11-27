"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  ShoppingBag,
  MessageCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminOrderDetailModal, { OrderDetail } from "./AdminOrderDetailModal";
import { playOrderChime } from "./AdminAudioAlert";
import { toast } from "sonner";

export interface OrderRow {
  id: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  deliveryStatus: "pending" | "assigned" | "picked_up" | "delivered" | "failed";
  deliveredAt: string | null;
  itemsCount: number;
}

interface AdminOrdersProps {
  isSoundEnabled: boolean;
  initialOrderId?: string | null;
}

export default function AdminOrders({
  isSoundEnabled,
  initialOrderId,
}: AdminOrdersProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const prevOrdersCountRef = useRef<number | null>(null);

  const fetchOrders = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        search: searchQuery,
        sort: sortOption,
      });

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      const fetchedOrders: OrderRow[] = data.orders || [];

      // Check if new order arrived while viewing
      if (prevOrdersCountRef.current !== null && data.total > prevOrdersCountRef.current) {
        const diff = data.total - prevOrdersCountRef.current;
        toast.success(`🔔 ${diff} new order(s) placed!`, {
          duration: 10000,
        });
        if (isSoundEnabled) {
          playOrderChime(0.6);
        }
      }

      prevOrdersCountRef.current = data.total;
      setOrders(fetchedOrders);
      setTotalCount(data.total || 0);
    } catch (err: unknown) {
      console.warn("Error loading orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery, sortOption, isSoundEnabled]);

  // Initial load and filter change
  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Polling for live updates every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const loadOrderDetail = useCallback(async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setSelectedOrder(data.order);
    } catch {
      toast.error("Failed to load order details.");
    } finally {
      setLoadingOrderId(null);
    }
  }, []);

  // Load initial order detail if passed (e.g. from push notification click)
  useEffect(() => {
    if (initialOrderId) {
      loadOrderDetail(initialOrderId);
    }
  }, [initialOrderId, loadOrderDetail]);

  const handleQuickStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Status update failed");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as OrderRow["status"] } : o))
      );
      toast.success(`Order #${orderId.slice(0, 8)} set to ${nextStatus}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "paid":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "shipped":
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "delivered":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "cancelled":
        return "bg-red-100 text-red-900 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, phone, address, or order ID..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-medium text-text placeholder-text-muted/60 transition focus:border-primary focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status & Sort Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex overflow-x-auto rounded-xl border border-border bg-background p-1">
            {["all", "pending", "paid", "shipped", "delivered", "cancelled"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-primary shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount_high">Amount: High to Low</option>
            <option value="amount_low">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              All Orders ({totalCount})
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-muted">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading live orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Delivery Address</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {orders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleString("en-UG", {
                    dateStyle: "short",
                    timeStyle: "short",
                  });
                  const cleanPhone = order.customerPhone.replace(/\D/g, "");
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${order.customerName}, this is Fruitful Market UG regarding your order #${order.id.slice(0, 8)}.`
                  )}`;

                  return (
                    <tr key={order.id} className="transition hover:bg-background/50">
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-primary">#{order.id.slice(0, 8)}</p>
                        <p className="text-[11px] text-text-muted">{dateStr}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-text">{order.customerName}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span>{order.customerPhone}</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate text-text-muted" title={order.shippingAddress}>
                        {order.shippingAddress}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-primary-dark tabular-nums">
                        UGX {Number(order.totalAmount).toLocaleString("en-UG")}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => loadOrderDetail(order.id)}
                          disabled={loadingOrderId === order.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary shadow-2xs transition hover:border-primary/40 hover:bg-background cursor-pointer disabled:opacity-50"
                        >
                          <Eye className="h-3 w-3" />
                          <span>{loadingOrderId === order.id ? "Loading..." : "Details"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-background px-4 py-3 text-xs text-text-muted">
            <span>
              Page {page} of {totalPages} ({totalCount} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 font-semibold text-text disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 font-semibold text-text disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={() => {
            fetchOrders(false);
            loadOrderDetail(selectedOrder.id);
          }}
        />
      )}
    </div>
  );
}
