"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  Users,
  Boxes,
  BarChart3,
  Settings,
  Store,
  LogOut,
  X,
} from "lucide-react";
import { useAdminAuth } from "./AdminAuthGate";
import { PWAInstallButton } from "../pwa/PWAInstallButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "Live" },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/variants", label: "Variants", icon: Sparkles },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  pendingCount?: number;
}

export default function AdminSidebar({
  isOpen = false,
  onClose,
  pendingCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-primary text-white">
      {/* Top branding */}
      <div className="p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary font-black shadow-md">
              <span className="text-xl">F</span>
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-white">
                Fruitful Market
              </span>
              <span className="block text-[11px] font-semibold text-accent tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 md:hidden"
              aria-label="Close sidebar menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="mt-5 space-y-1" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent text-primary font-bold shadow-xs"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition ${
                      isActive ? "text-primary" : "text-white/70 group-hover:text-accent"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.href === "/admin/orders" && pendingCount > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      isActive
                        ? "bg-primary text-accent"
                        : "bg-accent text-primary"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & PWA Install */}
      <div className="border-t border-white/10 p-5 space-y-3">
        {/* PWA In-app install banner */}
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[11px] font-medium text-white/70 mb-2">
            Install Fruitful on desktop or phone for instant order notifications.
          </p>
          <PWAInstallButton variant="compact" className="w-full justify-center" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-accent transition"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Storefront</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-red-200 transition cursor-pointer"
            aria-label="Sign out of admin"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
