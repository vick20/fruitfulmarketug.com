import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/src/lib/admin/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client not configured" }, { status: 503 });
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
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
          delivered_at,
          personnel_id,
          delivery_personnel (
            id,
            name,
            phone
          )
        ),
        order_items (
          id,
          quantity,
          unit_price_at_purchase,
          variant_id,
          variants (
            id,
            sku,
            price,
            product_id,
            products (
              id,
              name,
              slug,
              product_images (
                url,
                alt_text
              )
            ),
            variant_attributes (
              name,
              value
            )
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const delivery = Array.isArray(order.deliveries) ? order.deliveries[0] : order.deliveries;
    const personnelRaw = delivery?.delivery_personnel;
    const personnel = Array.isArray(personnelRaw) ? personnelRaw[0] : personnelRaw;

    type RawOrderItem = {
      id: string;
      quantity: number;
      unit_price_at_purchase: number;
      variant_id: string;
      variants: {
        id: string;
        sku: string;
        price: number;
        products: {
          id: string;
          name: string;
          slug: string;
          product_images: Array<{ url: string; alt_text?: string | null }> | null;
        } | null;
        variant_attributes: Array<{ name: string; value: string }> | null;
      } | null;
    };

    const items = ((order.order_items || []) as unknown as RawOrderItem[]).map((it) => {
      const variant = it.variants;
      const product = variant?.products;
      const attrs = (variant?.variant_attributes || [])
        .map((a) => `${a.name}: ${a.value}`)
        .join(" · ");
      const img = variant?.products?.product_images?.[0]?.url || "";

      return {
        id: it.id,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price_at_purchase),
        subtotal: it.quantity * Number(it.unit_price_at_purchase),
        variantId: it.variant_id,
        sku: variant?.sku || "N/A",
        productName: product?.name || "Product Item",
        variantLabel: attrs || variant?.sku || "",
        imageUrl: img,
      };
    });

    return NextResponse.json({
      order: {
        id: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        shippingAddress: order.shipping_address,
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
        delivery: {
          id: delivery?.id || null,
          status: delivery?.status || "pending",
          deliveredAt: delivery?.delivered_at || null,
          personnelName: (personnel as { name?: string } | null | undefined)?.name || null,
          personnelPhone: (personnel as { phone?: string } | null | undefined)?.phone || null,
        },
        items,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch order", details: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      status?: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
      deliveryStatus?: "pending" | "assigned" | "picked_up" | "delivered" | "failed";
    };

    if (body.status) {
      const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid order status value" }, { status: 400 });
      }

      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({ status: body.status })
        .eq("id", id);

      if (updateOrderError) {
        throw updateOrderError;
      }
    }

    if (body.deliveryStatus) {
      const validDelivery = ["pending", "assigned", "picked_up", "delivered", "failed"];
      if (!validDelivery.includes(body.deliveryStatus)) {
        return NextResponse.json({ error: "Invalid delivery status value" }, { status: 400 });
      }

      const updateData: { status: string; delivered_at?: string | null } = {
        status: body.deliveryStatus,
      };

      if (body.deliveryStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error: updateDeliveryError } = await supabase
        .from("deliveries")
        .update(updateData)
        .eq("order_id", id);

      if (updateDeliveryError) {
        throw updateDeliveryError;
      }
    }

    return NextResponse.json({ success: true, message: "Order updated successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update order", details: message }, { status: 500 });
  }
}
