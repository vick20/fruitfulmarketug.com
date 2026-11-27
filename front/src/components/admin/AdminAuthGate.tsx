"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Lock, ShieldCheck, ArrowRight, Store } from "lucide-react";
import Link from "next/link";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export default function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      setIsAuthenticated(Boolean(data?.authenticated));
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (pass: string) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setErrorMsg(data.error || "Invalid password.");
        return { success: false, error: data.error };
      }
    } catch {
      setErrorMsg("Failed to connect to authentication service.");
      return { success: false, error: "Network error" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-text-muted">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-accent shadow-md">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl">
              Fruitful Market Admin
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Secure store administration and order dispatch portal
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-xl sm:p-8">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await login(password);
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-text-muted"
                >
                  Admin Passcode
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin passcode"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-text placeholder-text-muted/60 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="mt-1.5 text-xs text-text-muted">
                  Default passcode: <code className="rounded bg-background px-1.5 py-0.5 font-mono text-primary font-semibold">fruitful2025</code>
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Verifying credentials...</span>
                ) : (
                  <>
                    <span>Unlock Dashboard</span>
                    <ArrowRight className="h-4 w-4 text-accent" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-fresh" />
                  <span>Encrypted Session</span>
                </span>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>Return to Store</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
