import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/src/lib/admin/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  // If Supabase is not configured, provide clean zeroed or starter structure
  if (!supabase) {
    return NextResponse.json({
      metrics: {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        activeProducts: 0,
      },
      statusCounts: { pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 },
      recentOrders: [],
      connected: false,
      message: "Supabase Service Role Key not set.",
    });
  }

  try {
    // 1. Fetch orders stats
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, total_amount, status, created_at")
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    const orders = ordersData ?? [];
    const totalOrders = orders.length;

    let pendingOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;

    const statusCounts: Record<string, number> = {
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      const status = order.status || "pending";
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;

      if (status === "pending") pendingOrders++;
      if (status === "delivered") completedOrders++;
      if (status !== "cancelled") {
        totalRevenue += Number(order.total_amount || 0);
      }
    }

    // 2. Fetch active products count
    const { count: activeProductsCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const recentOrders = orders.slice(0, 8);

    return NextResponse.json({
      metrics: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeProducts: activeProductsCount ?? 0,
      },
      statusCounts,
      recentOrders,
      connected: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics", details: message },
      { status: 500 }
    );
  }
}
