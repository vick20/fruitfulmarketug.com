import * as webpush from "web-push";
import { VAPID_KEYS } from "./vapid";
import { getAllPushSubscriptions, removePushSubscription } from "./push-store";

let configuredKeyPair = "";

function ensureVapidConfigured() {
  const signature = `${VAPID_KEYS.subject}|${VAPID_KEYS.publicKey}|${VAPID_KEYS.privateKey}`;
  if (configuredKeyPair !== signature) {
    webpush.setVapidDetails(
      VAPID_KEYS.subject,
      VAPID_KEYS.publicKey,
      VAPID_KEYS.privateKey
    );
    configuredKeyPair = signature;
  }
}

export interface OrderPushPayload {
  title: string;
  body: string;
  orderId?: string;
  url?: string;
  totalAmount?: number;
}

export async function broadcastPushNotification(payload: OrderPushPayload): Promise<{
  totalSubscriptions: number;
  totalSent: number;
  failedCount: number;
  errors: string[];
}> {
  ensureVapidConfigured();

  const subscriptions = await getAllPushSubscriptions();
  if (subscriptions.length === 0) {
    return { totalSubscriptions: 0, totalSent: 0, failedCount: 0, errors: [] };
  }

  const payloadString = JSON.stringify(payload);
  let totalSent = 0;
  let failedCount = 0;
  const errors: string[] = [];

  const pushPromises = subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        subscription as webpush.PushSubscription,
        payloadString,
        {
          TTL: 86400, // 24 hours
          urgency: "high",
        }
      );
      totalSent++;
    } catch (err: unknown) {
      failedCount++;
      const statusCode = (err as { statusCode?: number })?.statusCode;
      const msg = err instanceof Error ? err.message : String(err);
      // 404 or 410 indicates the subscription has expired or unsubscribed
      if (statusCode === 404 || statusCode === 410) {
        await removePushSubscription(subscription.endpoint);
        errors.push(`Expired subscription removed (${statusCode})`);
      } else {
        console.warn("[WebPush] Notification delivery failed:", statusCode, msg);
        errors.push(`Push error (${statusCode ?? "unknown"}): ${msg}`);
      }
    }
  });

  await Promise.allSettled(pushPromises);
  return {
    totalSubscriptions: subscriptions.length,
    totalSent,
    failedCount,
    errors,
  };
}

export async function sendNewOrderPushNotification(order: {
  id: string;
  customer_name: string;
  total_amount: number;
}): Promise<{ totalSent: number; failedCount: number }> {
  const formattedTotal = Number(order.total_amount).toLocaleString("en-UG");
  const payload: OrderPushPayload = {
    title: "🔔 New Order Received!",
    body: `${order.customer_name} placed an order for UGX ${formattedTotal}. Tap to review in Admin.`,
    orderId: order.id,
    url: `/admin/orders/${order.id}`,
    totalAmount: order.total_amount,
  };

  try {
    const result = await broadcastPushNotification(payload);
    return { totalSent: result.totalSent, failedCount: result.failedCount };
  } catch (err) {
    console.warn("[WebPush] Error broadcasting new order notification:", err);
    return { totalSent: 0, failedCount: 0 };
  }
}
