"use client";

import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-500/95 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xs transition animate-in fade-in slide-in-from-bottom-2"
    >
      <WifiOff className="h-4 w-4 animate-pulse" aria-hidden="true" />
      <span>Offline Mode — Cached products displayed. Live checkout requires reconnection.</span>
    </div>
  );
};
