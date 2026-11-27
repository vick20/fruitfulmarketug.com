import { NextResponse } from "next/server";
import { broadcastPushNotification } from "@/src/lib/push/send-push";

export async function POST() {
  try {
    const result = await broadcastPushNotification({
      title: "🍇 Fruitful Market UG — Notification Test",
      body: "Push notification system is working perfectly on this device!",
      url: "/admin/orders",
    });

    return NextResponse.json({
      success: true,
      message: `Test push sent to ${result.totalSent} registered device(s).`,
      totalSent: result.totalSent,
      failedCount: result.failedCount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send test push notification.", details: errorMsg },
      { status: 500 }
    );
  }
}
