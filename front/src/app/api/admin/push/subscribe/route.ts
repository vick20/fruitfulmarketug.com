import { NextRequest, NextResponse } from "next/server";
import { getVapidPublicKey } from "@/src/lib/push/vapid";
import {
  savePushSubscription,
  removePushSubscription,
  getAllPushSubscriptions,
  checkPushStorageStatus,
  type PushSubscriptionJSON,
} from "@/src/lib/push/push-store";

export async function GET() {
  const [subscriptions, storageStatus] = await Promise.all([
    getAllPushSubscriptions(),
    checkPushStorageStatus(),
  ]);
  return NextResponse.json({
    publicKey: getVapidPublicKey(),
    activeSubscriptionsCount: subscriptions.length,
    ...storageStatus,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { subscription?: PushSubscriptionJSON };
    if (!body?.subscription?.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription payload." },
        { status: 400 }
      );
    }

    const res = await savePushSubscription(body.subscription);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const subscriptions = await getAllPushSubscriptions();

    return NextResponse.json({
      success: true,
      message: "Subscription registered.",
      activeSubscriptionsCount: subscriptions.length,
      supabasePersisted: res.supabasePersisted,
      warning: res.warning,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save push subscription." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { endpoint?: string };
    if (!body?.endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required to unsubscribe." },
        { status: 400 }
      );
    }

    await removePushSubscription(body.endpoint);
    return NextResponse.json({ success: true, message: "Subscription removed." });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove subscription." },
      { status: 500 }
    );
  }
}
