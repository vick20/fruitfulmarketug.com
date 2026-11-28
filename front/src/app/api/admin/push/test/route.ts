import { NextResponse } from "next/server";
import { broadcastPushNotification } from "@/src/lib/push/send-push";

export async function POST() {
  try {
    const result = await broadcastPushNotification({
      title: "🍇 Fruitful Market UG — Notification Test",
      body: "Push notification system is working even when the app is in the background!",
      url: "/admin/orders",
    });

    if (result.totalSubscriptions === 0) {
      return NextResponse.json(
        {
          error:
            "No device subscriptions found on the server. Click 'Enable Push on this Device' first.",
          totalSent: 0,
          failedCount: 0,
        },
        { status: 400 }
      );
    }

    if (result.totalSent === 0 && result.failedCount > 0) {
      return NextResponse.json(
        {
          error: `Push delivery failed for ${result.failedCount} device(s): ${result.errors.join("; ")}`,
          totalSent: 0,
          failedCount: result.failedCount,
          errors: result.errors,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test push sent to ${result.totalSent} registered device(s).`,
      totalSent: result.totalSent,
      failedCount: result.failedCount,
      errors: result.errors,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send test push notification.", details: errorMsg },
      { status: 500 }
    );
  }
}
