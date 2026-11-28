import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { sendNewOrderPushNotification } from "@/src/lib/push/send-push";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderItemInput = {
  variantId?: unknown;
  quantity?: unknown;
};

type CreateOrderBody = {
  customerName?: unknown;
  customerPhone?: unknown;
  shippingAddress?: unknown;
  items?: unknown;
};

type VariantRow = {
  id: string;
  price: number | string;
  is_active: boolean;
  products:
    | { id: string; is_active: boolean }
    | Array<{ id: string; is_active: boolean }>
    | null;
  variant_attributes: Array<{ price: number | string | null }> | null;
};

export async function POST(request: NextRequest) {
  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const customerName =
    typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerPhone =
    typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
  const shippingAddress =
    typeof body.shippingAddress === "string" ? body.shippingAddress.trim() : "";

  if (customerName.length < 2 || customerName.length > 120) {
    return NextResponse.json(
      { error: "Please provide a valid customer name (2-120 characters)." },
      { status: 400 }
    );
  }

  if (
    customerPhone.length < 7 ||
    customerPhone.length > 30 ||
    !/\d{6,}/.test(customerPhone.replace(/\D/g, ""))
  ) {
    return NextResponse.json(
      { error: "Please provide a valid phone number." },
      { status: 400 }
    );
  }

  if (shippingAddress.length < 5 || shippingAddress.length > 500) {
    return NextResponse.json(
      { error: "Please provide a complete shipping address (5-500 characters)." },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    return NextResponse.json(
      { error: "Order must include between 1 and 100 items." },
      { status: 400 }
    );
  }

  const mergedQuantities = new Map<string, number>();
  for (const rawItem of body.items as OrderItemInput[]) {
    if (!rawItem || typeof rawItem !== "object") {
      return NextResponse.json(
        { error: "Each order item must be an object." },
        { status: 400 }
      );
    }

    const variantId =
      typeof rawItem.variantId === "string" ? rawItem.variantId.trim() : "";
    const quantity =
      typeof rawItem.quantity === "number" ? rawItem.quantity : Number.NaN;

    if (!UUID_REGEX.test(variantId)) {
      return NextResponse.json(
        { error: "Each order item must reference a valid variant UUID." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        { error: "Item quantities must be whole numbers between 1 and 1000." },
        { status: 400 }
      );
    }

    mergedQuantities.set(
      variantId,
      (mergedQuantities.get(variantId) ?? 0) + quantity
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Order service is not configured on the server. Set SUPABASE_SERVICE_ROLE_KEY in environment secrets.",
      },
      { status: 503 }
    );
  }

  const variantIds = Array.from(mergedQuantities.keys());
  const { data: variantsData, error: variantsError } = await supabase
    .from("variants")
    .select(
      `
      id,
      price,
      is_active,
      products!inner(id, is_active),
      variant_attributes(price)
    `
    )
    .in("id", variantIds)
    .eq("is_active", true);

  if (variantsError) {
    return NextResponse.json(
      { error: "Failed to verify product variants." },
      { status: 500 }
    );
  }

  const variantMap = new Map<string, VariantRow>();
  for (const row of (variantsData ?? []) as unknown as VariantRow[]) {
    const prod = Array.isArray(row.products) ? row.products[0] : row.products;
    if (prod?.is_active) {
      variantMap.set(row.id, row);
    }
  }

  const orderItemsPayload: Array<{
    variant_id: string;
    quantity: number;
    unit_price_at_purchase: number;
  }> = [];

  let totalAmount = 0;

  for (const [variantId, quantity] of mergedQuantities.entries()) {
    const variant = variantMap.get(variantId);
    if (!variant) {
      return NextResponse.json(
        {
          error:
            "One or more items in your basket are no longer available. Please clear your basket and add current products.",
        },
        { status: 400 }
      );
    }

    const pricedAttr = (variant.variant_attributes ?? []).find(
      (attr) => attr.price !== null && attr.price !== undefined
    );
    const unitPrice = Number(pricedAttr ? pricedAttr.price : variant.price);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return NextResponse.json(
        { error: "Invalid product pricing detected for a selected variant." },
        { status: 500 }
      );
    }

    const roundedUnitPrice = Math.round(unitPrice * 100) / 100;
    totalAmount += roundedUnitPrice * quantity;
    orderItemsPayload.push({
      variant_id: variantId,
      quantity,
      unit_price_at_purchase: roundedUnitPrice,
    });
  }

  totalAmount = Math.round(totalAmount * 100) / 100;

  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      total_amount: totalAmount,
      status: "pending",
    })
    .select("id, total_amount, status, created_at")
    .single();

  if (orderError || !createdOrder) {
    return NextResponse.json(
      { error: "Unable to create order in database." },
      { status: 500 }
    );
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItemsPayload.map((item) => ({
      order_id: createdOrder.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price_at_purchase: item.unit_price_at_purchase,
    }))
  );

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", createdOrder.id);
    return NextResponse.json(
      { error: "Unable to save order items." },
      { status: 500 }
    );
  }

  const { error: deliveryError } = await supabase.from("deliveries").insert({
    order_id: createdOrder.id,
    status: "pending",
  });

  if (deliveryError) {
    await supabase.from("orders").delete().eq("id", createdOrder.id);
    return NextResponse.json(
      { error: "Unable to initialize delivery record for order." },
      { status: 500 }
    );
  }

  // Broadcast Web Push notification to all subscribed admin devices before returning response
  try {
    await sendNewOrderPushNotification({
      id: createdOrder.id,
      customer_name: customerName,
      total_amount: totalAmount,
    });
  } catch (err) {
    console.warn("[Orders API] Push notification broadcast error:", err);
  }

  return NextResponse.json(
    {
      orderId: createdOrder.id,
      status: createdOrder.status,
      totalAmount: Number(createdOrder.total_amount),
      createdAt: createdOrder.created_at,
    },
    { status: 201 }
  );
}
