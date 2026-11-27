"use client";

import React, { useState } from "react";
import { Download, Share2, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";

interface PWAInstallButtonProps {
  className?: string;
  variant?: "primary" | "outline" | "compact";
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = "",
  variant = "primary",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running in standalone mode already, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === "compact") {
      return (
        <button
          type="button"
          onClick={install}
          title="Install Fruitful App"
          aria-label="Install Fruitful App"
          className={`inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-primary shadow-xs transition hover:opacity-90 cursor-pointer ${className}`}
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Install App</span>
        </button>
      );
    }

    if (variant === "outline") {
      return (
        <button
          type="button"
          onClick={install}
          aria-label="Install Fruitful App"
          className={`inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-surface px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-background cursor-pointer ${className}`}
        >
          <Smartphone className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        aria-label="Install Fruitful App"
        className={`inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark cursor-pointer ${className}`}
      >
        <Download className="h-4 w-4 text-accent" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Install on iPhone / iPad"
          className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-background cursor-pointer ${className}`}
        >
          <Share2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            onClick={() => setShowIOSGuide(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Install on iPhone or iPad"
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-primary">Install Fruitful Market</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-text-muted hover:bg-background"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-text">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/30 font-bold text-xs text-primary">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button <Share2 className="inline h-3.5 w-3.5" /> in your Safari toolbar at the bottom.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/30 font-bold text-xs text-primary">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/30 font-bold text-xs text-primary">
                    3
                  </span>
                  <p>Tap <strong>Add</strong> at top right to install Fruitful Market UG!</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
