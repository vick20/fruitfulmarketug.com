import * as webpush from "web-push";
import { VAPID_KEYS } from "./vapid";
import { getAllPushSubscriptions, removePushSubscription } from "./push-store";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      VAPID_KEYS.subject,
      VAPID_KEYS.publicKey,
      VAPID_KEYS.privateKey
    );
    vapidConfigured = true;
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
  totalSent: number;
  failedCount: number;
}> {
  ensureVapidConfigured();

  const subscriptions = await getAllPushSubscriptions();
  if (subscriptions.length === 0) {
    return { totalSent: 0, failedCount: 0 };
  }

  const payloadString = JSON.stringify(payload);
  let totalSent = 0;
  let failedCount = 0;

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
      // 404 or 410 indicates the subscription has expired or unsubscribed
      if (statusCode === 404 || statusCode === 410) {
        await removePushSubscription(subscription.endpoint);
      } else {
        console.warn("[WebPush] Notification delivery failed:", err);
      }
    }
  });

  await Promise.allSettled(pushPromises);
  return { totalSent, failedCount };
}

export async function sendNewOrderPushNotification(order: {
  id: string;
  customer_name: string;
  total_amount: number;
}): Promise<void> {
  const formattedTotal = Number(order.total_amount).toLocaleString("en-UG");
  const payload: OrderPushPayload = {
    title: "🔔 New Order Received!",
    body: `${order.customer_name} placed an order for UGX ${formattedTotal}. Tap to review in Admin.`,
    orderId: order.id,
    url: `/admin/orders/${order.id}`,
    totalAmount: order.total_amount,
  };

  try {
    await broadcastPushNotification(payload);
  } catch (err) {
    console.warn("[WebPush] Error broadcasting new order notification:", err);
  }
}
