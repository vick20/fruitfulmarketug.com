"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Package,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Bell,
  Users,
} from "lucide-react";

export interface OverviewMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  activeProducts: number;
}

export interface RecentOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface AdminOverviewProps {
  metrics: OverviewMetrics;
  statusCounts: Record<string, number>;
  recentOrders: RecentOrder[];
  connected: boolean;
  onSelectOrder?: (orderId: string) => void;
}

export default function AdminOverview({
  metrics,
  statusCounts,
  recentOrders,
  connected,
  onSelectOrder,
}: AdminOverviewProps) {
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

  const totalCalculated =
    (statusCounts.pending || 0) +
    (statusCounts.paid || 0) +
    (statusCounts.shipped || 0) +
    (statusCounts.delivered || 0) +
    (statusCounts.cancelled || 0);

  return (
    <div className="space-y-6">
      {!connected && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Supabase Database Connection Note</p>
            <p className="text-amber-800">
              Provide <code className="font-mono font-semibold">SUPABASE_SERVICE_ROLE_KEY</code> in environment secrets to persist real-time orders directly to your hosted PostgreSQL database.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Gross Revenue
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-primary-dark tabular-nums">
              UGX {Number(metrics.totalRevenue).toLocaleString("en-UG")}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-fresh font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Non-cancelled orders</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total Orders
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/30 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-text tabular-nums">
              {metrics.totalOrders}
            </div>
            <p className="mt-1 text-xs text-text-muted">Lifetime store orders</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Pending Dispatch
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {metrics.pendingOrders}
            </div>
            {metrics.pendingOrders > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                Action required
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-text-muted">Awaiting confirmation or delivery</p>
        </div>

        {/* Active Products */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Active Products
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fresh/20 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-text tabular-nums">
              {metrics.activeProducts}
            </div>
            <p className="mt-1 text-xs text-text-muted">Live on storefront catalog</p>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/admin/orders"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary p-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4 text-accent" />
          <span>Process Orders</span>
        </Link>
        <Link
          href="/admin/products"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white p-3.5 text-xs font-semibold text-primary shadow-xs transition hover:border-primary/40 hover:bg-background cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </Link>
        <Link
          href="/admin/customers"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white p-3.5 text-xs font-semibold text-primary shadow-xs transition hover:border-primary/40 hover:bg-background cursor-pointer"
        >
          <Users className="h-4 w-4" />
          <span>Customer Directory</span>
        </Link>
        <Link
          href="/admin/settings"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white p-3.5 text-xs font-semibold text-primary shadow-xs transition hover:border-primary/40 hover:bg-background cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span>Notification Setup</span>
        </Link>
      </div>

      {/* Status Breakdown Bar */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-primary">Order Pipeline Distribution</h2>
        <p className="text-xs text-text-muted">Current status of all logged orders</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
            <span className="text-[11px] font-semibold text-amber-800 uppercase">Pending</span>
            <div className="text-lg font-bold text-amber-900 tabular-nums">
              {statusCounts.pending || 0}
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
            <span className="text-[11px] font-semibold text-blue-800 uppercase">Paid</span>
            <div className="text-lg font-bold text-blue-900 tabular-nums">
              {statusCounts.paid || 0}
            </div>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
            <span className="text-[11px] font-semibold text-purple-800 uppercase">Shipped</span>
            <div className="text-lg font-bold text-purple-900 tabular-nums">
              {statusCounts.shipped || 0}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase">Delivered</span>
            <div className="text-lg font-bold text-emerald-900 tabular-nums">
              {statusCounts.delivered || 0}
            </div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
            <span className="text-[11px] font-semibold text-red-800 uppercase">Cancelled</span>
            <div className="text-lg font-bold text-red-900 tabular-nums">
              {statusCounts.cancelled || 0}
            </div>
          </div>
        </div>

        {totalCalculated > 0 && (
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-background">
            <div
              style={{ width: `${((statusCounts.pending || 0) / totalCalculated) * 100}%` }}
              className="bg-amber-400"
              title="Pending"
            />
            <div
              style={{ width: `${((statusCounts.paid || 0) / totalCalculated) * 100}%` }}
              className="bg-blue-500"
              title="Paid"
            />
            <div
              style={{ width: `${((statusCounts.shipped || 0) / totalCalculated) * 100}%` }}
              className="bg-purple-500"
              title="Shipped"
            />
            <div
              style={{ width: `${((statusCounts.delivered || 0) / totalCalculated) * 100}%` }}
              className="bg-emerald-500"
              title="Delivered"
            />
            <div
              style={{ width: `${((statusCounts.cancelled || 0) / totalCalculated) * 100}%` }}
              className="bg-red-400"
              title="Cancelled"
            />
          </div>
        )}
      </div>

      {/* Recent Activity / Recent Orders */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-sm font-bold text-primary">Recent Orders</h2>
            <p className="text-xs text-text-muted">Latest activity incoming from storefront</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>View All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No orders found yet. When a customer checks out, orders will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleString("en-UG", {
                    dateStyle: "short",
                    timeStyle: "short",
                  });

                  return (
                    <tr key={order.id} className="transition hover:bg-background/60">
                      <td className="px-5 py-3 font-mono text-[11px] font-semibold text-primary">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 font-medium text-text">{order.customer_name}</td>
                      <td className="px-5 py-3 text-text-muted font-mono">{order.customer_phone}</td>
                      <td className="px-5 py-3 font-bold text-primary-dark tabular-nums">
                        UGX {Number(order.total_amount).toLocaleString("en-UG")}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-text-muted">{dateStr}</td>
                      <td className="px-5 py-3 text-right">
                        {onSelectOrder ? (
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order.id)}
                            className="font-semibold text-primary hover:underline cursor-pointer"
                          >
                            Details &rarr;
                          </button>
                        ) : (
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            Details &rarr;
                          </Link>
                        )}
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
