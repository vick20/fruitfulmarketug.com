"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminAuthGate from "@/src/components/admin/AdminAuthGate";
import AdminSidebar from "@/src/components/admin/AdminSidebar";
import AdminHeader from "@/src/components/admin/AdminHeader";
import { playOrderChime } from "@/src/components/admin/AdminAudioAlert";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const prevPendingRef = useRef<number | null>(null);
  const isSoundEnabledRef = useRef(isSoundEnabled);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  const fetchGlobalMetrics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const data = await res.json();
        const pending = Number(data.metrics?.pendingOrders || 0);

        if (prevPendingRef.current !== null && pending > prevPendingRef.current) {
          const diff = pending - prevPendingRef.current;
          toast.success(`🔔 ${diff} new order(s) received!`, {
            duration: 12000,
            action: {
              label: "View Orders",
              onClick: () => {
                router.push("/admin/orders");
              },
            },
          });
          if (isSoundEnabledRef.current) {
            playOrderChime(0.6);
          }
        }

        prevPendingRef.current = pending;
        setPendingOrdersCount(pending);
      }
    } catch {
      // Ignore background fetch error
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchGlobalMetrics();
    const interval = setInterval(fetchGlobalMetrics, 15000);
    return () => clearInterval(interval);
  }, [fetchGlobalMetrics]);

  return (
    <AdminAuthGate>
      <div className="min-h-screen bg-background text-foreground">
        {/* Responsive Sidebar */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          pendingCount={pendingOrdersCount}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col md:pl-64">
          <AdminHeader
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSoundEnabled={isSoundEnabled}
            onToggleSound={() => setIsSoundEnabled((prev) => !prev)}
            onRefresh={fetchGlobalMetrics}
            isRefreshing={isRefreshing}
          />

          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGate>
  );
}
