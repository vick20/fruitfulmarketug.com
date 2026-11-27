"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminOverview, { OverviewMetrics, RecentOrder } from "@/src/components/admin/AdminOverview";
import AdminOrderDetailModal, { OrderDetail } from "@/src/components/admin/AdminOrderDetailModal";
import { toast } from "sonner";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [connected, setConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const data = await res.json();
        setMetrics((prev) => data.metrics || prev);
        setStatusCounts(data.statusCounts || {});
        setRecentOrders(data.recentOrders || []);
        setConnected(Boolean(data.connected));
      }
    } catch {
      toast.error("Failed to load dashboard overview.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSelectOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setSelectedOrder(data.order);
    } catch {
      toast.error("Failed to open order details.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-text-muted">Loading live dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminOverview
        metrics={metrics}
        statusCounts={statusCounts}
        recentOrders={recentOrders}
        connected={connected}
        onSelectOrder={handleSelectOrder}
      />

      {selectedOrder && (
        <AdminOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={() => {
            fetchOverview();
            handleSelectOrder(selectedOrder.id);
          }}
        />
      )}
    </>
  );
}
