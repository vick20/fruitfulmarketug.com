"use client";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function keysEqual(a: ArrayBuffer | null, b: Uint8Array): boolean {
  if (!a) return false;
  const viewA = new Uint8Array(a);
  if (viewA.byteLength !== b.byteLength) return false;
  for (let i = 0; i < viewA.byteLength; i++) {
    if (viewA[i] !== b[i]) return false;
  }
  return true;
}

async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (!existing) {
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  } else {
    void existing.update().catch(() => {});
  }
  return navigator.serviceWorker.ready;
}

export async function subscribeAndSyncAdminPush(options?: {
  requestPermission?: boolean;
}): Promise<{
  ok: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  activeSubscriptionsCount?: number;
  supabasePersisted?: boolean;
  error?: string;
}> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return {
      ok: false,
      permission: "default",
      subscribed: false,
      error: "Push notifications are not supported on this browser/device.",
    };
  }

  let permission: NotificationPermission = Notification.permission;

  if (permission === "denied") {
    return {
      ok: false,
      permission,
      subscribed: false,
      error:
        "Notifications are blocked in your browser site permissions. Please allow them in your browser settings.",
    };
  }

  if (permission !== "granted") {
    if (!options?.requestPermission) {
      return {
        ok: false,
        permission,
        subscribed: false,
      };
    }
    permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        ok: false,
        permission,
        subscribed: false,
        error: "Notification permission was not granted.",
      };
    }
  }

  const reg = await ensureServiceWorkerReady();

  const keyRes = await fetch("/api/admin/push/subscribe", { cache: "no-store" });
  if (!keyRes.ok) {
    return {
      ok: false,
      permission,
      subscribed: false,
      error: "Failed to retrieve VAPID public key from server.",
    };
  }
  const keyData = (await keyRes.json()) as { publicKey?: string };
  const publicKey = keyData.publicKey;
  if (!publicKey) {
    return {
      ok: false,
      permission,
      subscribed: false,
      error: "Server VAPID public key is missing.",
    };
  }

  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  let subscription = await reg.pushManager.getSubscription();

  // If browser already has a subscription with an old/mismatched VAPID key, replace it
  if (subscription && !keysEqual(subscription.options?.applicationServerKey ?? null, applicationServerKey)) {
    try {
      await subscription.unsubscribe();
    } catch {
      // Continue to re-subscribe
    }
    subscription = null;
  }

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  const saveRes = await fetch("/api/admin/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  if (!saveRes.ok) {
    const errBody = await saveRes.json().catch(() => ({}));
    return {
      ok: false,
      permission,
      subscribed: false,
      error: errBody.error || "Failed to register device subscription on server.",
    };
  }

  const saveData = (await saveRes.json()) as {
    activeSubscriptionsCount?: number;
    supabasePersisted?: boolean;
  };

  return {
    ok: true,
    permission,
    subscribed: true,
    activeSubscriptionsCount: saveData.activeSubscriptionsCount,
    supabasePersisted: saveData.supabasePersisted,
  };
}
