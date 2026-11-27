import { getSupabaseAdminClient } from "@/src/lib/supabase/server";

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// In-memory fallback cache so push notifications work immediately
const memorySubscriptions = new Map<string, PushSubscriptionJSON>();

export async function savePushSubscription(
  subscription: PushSubscriptionJSON
): Promise<{ success: boolean; error?: string }> {
  if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return { success: false, error: "Invalid push subscription object." };
  }

  memorySubscriptions.set(subscription.endpoint, subscription);

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
        // Table may not exist yet in Supabase - in-memory fallback is active
        console.warn("[Push Store] Supabase push table notice:", error.message);
      }
    } catch (err) {
      console.warn("[Push Store] Exception writing to Supabase:", err);
    }
  }

  return { success: true };
}

export async function removePushSubscription(
  endpoint: string
): Promise<{ success: boolean }> {
  memorySubscriptions.delete(endpoint);

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      await supabase.from("admin_push_subscriptions").delete().eq("endpoint", endpoint);
    } catch {
      // Ignore deletion errors
    }
  }

  return { success: true };
}

export async function getAllPushSubscriptions(): Promise<PushSubscriptionJSON[]> {
  const result: PushSubscriptionJSON[] = [];
  const endpoints = new Set<string>();

  // Add in-memory cached subscriptions
  for (const sub of memorySubscriptions.values()) {
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
            memorySubscriptions.set(sub.endpoint, sub);
          }
        }
      }
    } catch (err) {
      console.warn("[Push Store] Could not fetch subscriptions from Supabase:", err);
    }
  }

  return result;
}
