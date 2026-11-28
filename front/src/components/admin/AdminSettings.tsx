"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Volume2,
  Database,
  Smartphone,
  Copy,
  Check,
  Send,
} from "lucide-react";
import { playOrderChime } from "./AdminAudioAlert";
import { toast } from "sonner";
import { PWAInstallButton } from "../pwa/PWAInstallButton";

interface AdminSettingsProps {
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export default function AdminSettings({
  isSoundEnabled,
  onToggleSound,
}: AdminSettingsProps) {
  const [pushPermission, setPushPermission] = useState<"default" | "granted" | "denied">("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);
  const [activeSubsCount, setActiveSubsCount] = useState<number>(0);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchSubscriptionInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/push/subscribe");
      if (res.ok) {
        const data = await res.json();
        setActiveSubsCount(data.activeSubscriptionsCount || 0);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [fetchSubscriptionInfo]);

  const handleEnablePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Push notifications are not supported on this device/browser.");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error("Notifications are blocked in your browser site permissions. Please allow them in your URL bar settings.");
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const keyRes = await fetch("/api/admin/push/subscribe");
        const keyData = await keyRes.json();
        const publicKey = keyData.publicKey;

        if (!publicKey) throw new Error("Could not retrieve VAPID key");

        const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
        const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });

        await fetch("/api/admin/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });

        toast.success("Push notifications enabled! This device will be notified on new orders.");
        fetchSubscriptionInfo();
      } else {
        toast.info("Push notification permission was dismissed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(`Push registration error: ${msg}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/admin/push/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Test push notification dispatched!");
      } else {
        toast.error(data.error || "Failed to dispatch test notification.");
      }
    } catch {
      toast.error("Failed to connect to push notification server.");
    } finally {
      setIsSendingTest(false);
    }
  };

  const sqlSnippet = `-- Optional: Run in Supabase SQL Editor to persist Push Subscriptions across restarts
CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE admin_push_subscriptions ENABLE ROW LEVEL SECURITY;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    toast.success("SQL copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-primary">Store & Admin Configuration</h2>
        <p className="text-xs text-text-muted">
          Manage real-time alerts, browser push notifications, and database synchronization
        </p>
      </div>

      {/* Push Notifications Card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/30 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Browser Push Notifications</h3>
              <p className="text-xs text-text-muted">
                Receive real-time system alerts on desktop and phone even when dashboard is minimized
              </p>
            </div>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              pushPermission === "granted"
                ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                : pushPermission === "denied"
                ? "border-red-300 bg-red-100 text-red-900"
                : "border-amber-300 bg-amber-100 text-amber-900"
            }`}
          >
            Permission: {pushPermission}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <span className="text-xs font-semibold text-text-muted">Device Status</span>
            <p className="text-xs text-text">
              {pushPermission === "granted"
                ? "This browser is subscribed to order push notifications."
                : "This browser has not yet enabled push notifications."}
            </p>
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={isSubscribing}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 text-accent" />
              <span>{isSubscribing ? "Registering..." : "Enable Push on this Device"}</span>
            </button>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <span className="text-xs font-semibold text-text-muted">Registered Devices</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary tabular-nums">
                {activeSubsCount}
              </span>
              <span className="text-xs text-text-muted">active device subscription(s)</span>
            </div>
            <button
              type="button"
              onClick={handleSendTestPush}
              disabled={isSendingTest}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-bold text-primary shadow-2xs transition hover:bg-background disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSendingTest ? "Sending..." : "Send Test Notification"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Alerts Card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fresh/20 text-primary">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">In-Dashboard Audio Chime</h3>
              <p className="text-xs text-text-muted">
                Play an audible two-tone chime in the browser whenever a customer order arrives
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className={`rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              isSoundEnabled
                ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                : "border-gray-300 bg-gray-100 text-gray-700"
            }`}
          >
            {isSoundEnabled ? "Sound Enabled" : "Sound Muted"}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Test the synthesized order chime using the Web Audio API.
          </p>
          <button
            type="button"
            onClick={() => playOrderChime(0.6)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-white cursor-pointer"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Play Chime Sample</span>
          </button>
        </div>
      </div>

      {/* PWA Installation Card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Progressive Web App (PWA)</h3>
              <p className="text-xs text-text-muted">
                Install Fruitful Market UG on your phone or computer home screen for offline catalog browsing
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-text-muted">
            <p><strong>Supported:</strong> Chrome, Edge, Android, iOS Safari</p>
            <p><strong>Features:</strong> Standalone window, asset caching, fast boot, home screen icon.</p>
          </div>
          <PWAInstallButton variant="primary" />
        </div>
      </div>

      {/* Database Setup Helper Card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Supabase PostgreSQL Schema</h3>
              <p className="text-xs text-text-muted">
                All order, catalog, variant, and category records are stored directly in your Supabase hosted database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copySql}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white cursor-pointer"
          >
            {copiedSql ? <Check className="h-3.5 w-3.5 text-fresh" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSql ? "Copied" : "Copy SQL"}</span>
          </button>
        </div>

        <pre className="overflow-x-auto rounded-xl border border-border bg-background p-4 font-mono text-[11px] text-text">
          {sqlSnippet}
        </pre>
      </div>
    </div>
  );
}
