"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Store,
  RefreshCw,
  Radio,
} from "lucide-react";
import { playOrderChime } from "./AdminAudioAlert";
import { subscribeAndSyncAdminPush } from "@/src/lib/push/client-push";
import { toast } from "sonner";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AdminHeader({
  onToggleSidebar,
  title = "Dashboard",
  isSoundEnabled,
  onToggleSound,
  onRefresh,
  isRefreshing = false,
}: AdminHeaderProps) {
  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission);
      if (Notification.permission === "granted") {
        void subscribeAndSyncAdminPush({ requestPermission: false })
          .then((res) => {
            setPushStatus(res.permission);
            setIsPushSubscribed(res.subscribed);
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleRequestPush = async () => {
    setIsSubscribingPush(true);
    try {
      const res = await subscribeAndSyncAdminPush({ requestPermission: true });
      setPushStatus(res.permission);
      setIsPushSubscribed(res.subscribed);

      if (res.ok && res.subscribed) {
        toast.success(
          "Push notifications enabled! You will receive system alerts even when this tab is closed or in the background."
        );
      } else if (res.error) {
        toast.error(res.error);
      } else {
        toast.info("Push notification permission was dismissed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(`Push setup error: ${msg}`);
    } finally {
      setIsSubscribingPush(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur-md md:px-8">
      {/* Left title & mobile menu */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          className="rounded-xl border border-border p-2 text-text transition hover:bg-background md:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-primary md:text-xl">{title}</h1>
          <div className="hidden items-center gap-1.5 text-xs text-text-muted sm:flex">
            <span>Fruitful Market UG</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-fresh font-medium">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Realtime Store Engine</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh live data"
            aria-label="Refresh data"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-text transition hover:border-primary/40 hover:bg-white disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          </button>
        )}

        {/* Audio chime toggle */}
        <button
          type="button"
          onClick={() => {
            onToggleSound();
            if (!isSoundEnabled) {
              playOrderChime(0.5);
              toast.success("Order chime enabled & tested.");
            } else {
              toast.info("Order chime muted.");
            }
          }}
          title={isSoundEnabled ? "Chime enabled (click to mute)" : "Chime muted (click to enable)"}
          aria-label={isSoundEnabled ? "Mute order sound alerts" : "Enable order sound alerts"}
          className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition cursor-pointer ${
            isSoundEnabled
              ? "border-fresh/40 bg-fresh/10 text-primary-dark"
              : "border-border bg-background text-text-muted hover:text-text"
          }`}
        >
          {isSoundEnabled ? (
            <>
              <Volume2 className="h-4 w-4 text-fresh" />
              <span className="hidden sm:inline">Sound On</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4" />
              <span className="hidden sm:inline">Muted</span>
            </>
          )}
        </button>

        {/* Browser Push Notifications status & toggle */}
        <button
          type="button"
          onClick={handleRequestPush}
          disabled={isSubscribingPush}
          title={
            pushStatus === "granted" && isPushSubscribed
              ? "Push notifications are active on this device"
              : "Click to enable browser push notifications"
          }
          aria-label="Toggle push notifications"
          className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition cursor-pointer ${
            pushStatus === "granted" && isPushSubscribed
              ? "border-primary/20 bg-primary/[0.06] text-primary"
              : "border-border bg-background text-text-muted hover:border-primary/40 hover:text-text"
          }`}
        >
          {pushStatus === "granted" && isPushSubscribed ? (
            <>
              <Bell className="h-4 w-4 text-primary fill-accent" />
              <span className="hidden sm:inline">Push Active</span>
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isSubscribingPush ? "Activating..." : "Enable Push"}
              </span>
            </>
          )}
        </button>

        {/* Link to storefront */}
        <Link
          href="/"
          title="Open customer storefront"
          className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-background lg:flex"
        >
          <Store className="h-3.5 w-3.5" />
          <span>View Store</span>
        </Link>
      </div>
    </header>
  );
}
