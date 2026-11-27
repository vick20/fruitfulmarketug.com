import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/src/lib/admin/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ customers: [], connected: false });
  }

  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, shipping_address, total_amount, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Aggregate orders by customer phone number
    const customerMap = new Map<
      string,
      {
        phone: string;
        name: string;
        addresses: Set<string>;
        ordersCount: number;
        totalSpent: number;
        lastOrderDate: string;
        lastOrderStatus: string;
        orderIds: string[];
      }
    >();

    for (const order of orders ?? []) {
      const phone = (order.customer_phone || "").trim();
      if (!phone) continue;

      const existing = customerMap.get(phone);
      if (!existing) {
        const addresses = new Set<string>();
        if (order.shipping_address) addresses.add(order.shipping_address);

        customerMap.set(phone, {
          phone,
          name: order.customer_name || "Customer",
          addresses,
          ordersCount: 1,
          totalSpent: order.status !== "cancelled" ? Number(order.total_amount || 0) : 0,
          lastOrderDate: order.created_at,
          lastOrderStatus: order.status,
          orderIds: [order.id],
        });
      } else {
        if (order.shipping_address) existing.addresses.add(order.shipping_address);
        existing.ordersCount++;
        if (order.status !== "cancelled") {
          existing.totalSpent += Number(order.total_amount || 0);
        }
        existing.orderIds.push(order.id);
      }
    }

    const customers = Array.from(customerMap.values()).map((c) => ({
      phone: c.phone,
      name: c.name,
      shippingAddresses: Array.from(c.addresses),
      ordersCount: c.ordersCount,
      totalSpent: Math.round(c.totalSpent * 100) / 100,
      lastOrderDate: c.lastOrderDate,
      lastOrderStatus: c.lastOrderStatus,
      recentOrderIds: c.orderIds.slice(0, 5),
    }));

    // Sort by total spent or last order date
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({ customers, connected: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch customers", details: message }, { status: 500 });
  }
}
