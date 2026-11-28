import fs from "fs";
import path from "path";
import os from "os";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const FILE_CACHE_PATH = path.join(os.tmpdir(), "fruitful-push-subscriptions.json");

const globalForPush = globalThis as typeof globalThis & {
  __fruitfulPushSubscriptions?: Map<string, PushSubscriptionJSON>;
};

function getMemoryStore(): Map<string, PushSubscriptionJSON> {
  if (!globalForPush.__fruitfulPushSubscriptions) {
    globalForPush.__fruitfulPushSubscriptions = new Map<string, PushSubscriptionJSON>();
    // Hydrate from file cache on cold start
    try {
      if (fs.existsSync(FILE_CACHE_PATH)) {
        const raw = fs.readFileSync(FILE_CACHE_PATH, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const sub of parsed) {
            if (sub?.endpoint && sub?.keys?.p256dh && sub?.keys?.auth) {
              globalForPush.__fruitfulPushSubscriptions.set(sub.endpoint, sub);
            }
          }
        }
      }
    } catch {
      // Ignore file cache read errors
    }
  }
  return globalForPush.__fruitfulPushSubscriptions;
}

function persistFileCache(store: Map<string, PushSubscriptionJSON>) {
  try {
    fs.writeFileSync(
      FILE_CACHE_PATH,
      JSON.stringify(Array.from(store.values())),
      "utf8"
    );
  } catch {
    // Ignore file cache write errors on read-only serverless fs
  }
}

export async function savePushSubscription(
  subscription: PushSubscriptionJSON
): Promise<{
  success: boolean;
  supabasePersisted: boolean;
  warning?: string;
  error?: string;
}> {
  if (
    !subscription ||
    !subscription.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return {
      success: false,
      supabasePersisted: false,
      error: "Invalid push subscription object.",
    };
  }

  const store = getMemoryStore();
  store.set(subscription.endpoint, subscription);
  persistFileCache(store);

  let supabasePersisted = false;
  let warning: string | undefined;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("admin_push_subscriptions").upsert(
        {
          endpoint: subscription.endpoint,
          subscription: subscription,
          created_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );
      if (error) {
        warning = `Supabase table notice: ${error.message}`;
        console.warn("[Push Store] Supabase push table notice:", error.message);
      } else {
        supabasePersisted = true;
      }
    } catch (err) {
      warning = err instanceof Error ? err.message : "Supabase write exception";
      console.warn("[Push Store] Exception writing to Supabase:", err);
    }
  }

  return { success: true, supabasePersisted, warning };
}

export async function removePushSubscription(
  endpoint: string
): Promise<{ success: boolean }> {
  const store = getMemoryStore();
  store.delete(endpoint);
  persistFileCache(store);

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      await supabase
        .from("admin_push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
    } catch {
      // Ignore deletion errors
    }
  }

  return { success: true };
}

export async function getAllPushSubscriptions(): Promise<PushSubscriptionJSON[]> {
  const store = getMemoryStore();

  // Re-sync from file cache in case another worker process wrote a subscription
  try {
    if (fs.existsSync(FILE_CACHE_PATH)) {
      const raw = fs.readFileSync(FILE_CACHE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const sub of parsed) {
          if (sub?.endpoint && sub?.keys?.p256dh && sub?.keys?.auth && !store.has(sub.endpoint)) {
            store.set(sub.endpoint, sub);
          }
        }
      }
    }
  } catch {
    // Ignore file cache read errors
  }

  const result: PushSubscriptionJSON[] = [];
  const endpoints = new Set<string>();

  for (const sub of store.values()) {
    result.push(sub);
    endpoints.add(sub.endpoint);
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("admin_push_subscriptions")
        .select("subscription");

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const sub = row.subscription as PushSubscriptionJSON;
          if (sub && sub.endpoint && !endpoints.has(sub.endpoint)) {
            result.push(sub);
            endpoints.add(sub.endpoint);
            store.set(sub.endpoint, sub);
          }
        }
        persistFileCache(store);
      }
    } catch (err) {
      console.warn("[Push Store] Could not fetch subscriptions from Supabase:", err);
    }
  }

  return result;
}

export async function checkPushStorageStatus(): Promise<{
  supabaseConfigured: boolean;
  supabaseTableReady: boolean;
  supabaseError?: string;
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      supabaseConfigured: false,
      supabaseTableReady: false,
      supabaseError: "Supabase admin credentials not configured.",
    };
  }

  try {
    const { error } = await supabase
      .from("admin_push_subscriptions")
      .select("id", { count: "exact", head: true });

    if (error) {
      return {
        supabaseConfigured: true,
        supabaseTableReady: false,
        supabaseError: error.message,
      };
    }

    return {
      supabaseConfigured: true,
      supabaseTableReady: true,
    };
  } catch (err) {
    return {
      supabaseConfigured: true,
      supabaseTableReady: false,
      supabaseError: err instanceof Error ? err.message : "Query error",
    };
  }
}
