import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/src/lib/admin/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({
      orders: [],
      total: 0,
      page: 1,
      limit: 25,
      connected: false,
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const status = searchParams.get("status")?.trim().toLowerCase() || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "25", 10)));
  const sort = searchParams.get("sort") || "newest";

  try {
    let query = supabase.from("orders").select(
      `
      id,
      customer_name,
      customer_phone,
      shipping_address,
      total_amount,
      status,
      created_at,
      deliveries (
        id,
        status,
        delivered_at
      ),
      order_items (
        id,
        quantity,
        unit_price_at_purchase
      )
    `,
      { count: "exact" }
    );

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      // Search in customer_name, customer_phone, shipping_address or id
      query = query.or(
        `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,shipping_address.ilike.%${search}%,id.eq.${search.includes("-") ? search : "00000000-0000-0000-0000-000000000000"}`
      );
    }

    if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sort === "amount_high") {
      query = query.order("total_amount", { ascending: false });
    } else if (sort === "amount_low") {
      query = query.order("total_amount", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      throw error;
    }

    const orders = (data ?? []).map((order) => {
      const delivery = Array.isArray(order.deliveries) ? order.deliveries[0] : order.deliveries;
      const items = Array.isArray(order.order_items) ? order.order_items : [];
      const totalItemsCount = items.reduce((sum: number, it: { quantity: number }) => sum + (it.quantity || 1), 0);

      return {
        id: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        shippingAddress: order.shipping_address,
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
        deliveryStatus: delivery?.status || "pending",
        deliveredAt: delivery?.delivered_at || null,
        itemsCount: totalItemsCount,
      };
    });

    return NextResponse.json({
      orders,
      total: count ?? orders.length,
      page,
      limit,
      connected: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch orders", details: message },
      { status: 500 }
    );
  }
}
