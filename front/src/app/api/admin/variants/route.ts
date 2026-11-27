import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/src/lib/admin/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ variants: [], connected: false });
  }

  const productId = request.nextUrl.searchParams.get("productId");

  try {
    let query = supabase
      .from("variants")
      .select(
        `
        id,
        sku,
        price,
        is_active,
        product_id,
        created_at,
        products (
          id,
          name,
          slug
        ),
        variant_attributes (
          id,
          name,
          value,
          price
        )
      `
      )
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const variants = (data ?? []).map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      isActive: v.is_active,
      productId: v.product_id,
      productName: (v.products as { name?: string })?.name || "Product",
      createdAt: v.created_at,
      attributes: Array.isArray(v.variant_attributes) ? v.variant_attributes : [],
    }));

    return NextResponse.json({ variants, connected: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch variants", details: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      productId?: string;
      sku?: string;
      price?: number;
      attributeName?: string;
      attributeValue?: string;
    };

    if (!body.productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const sku = body.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const price = Math.max(0, Number(body.price) || 0);

    const { data: variant, error: varError } = await supabase
      .from("variants")
      .insert({
        product_id: body.productId,
        sku,
        price,
        is_active: true,
      })
      .select("id, sku, price, is_active, product_id, created_at")
      .single();

    if (varError || !variant) throw varError || new Error("Variant insert failed");

    if (body.attributeName?.trim() && body.attributeValue?.trim()) {
      await supabase.from("variant_attributes").insert({
        variant_id: variant.id,
        name: body.attributeName.trim(),
        value: body.attributeValue.trim(),
      });
    }

    return NextResponse.json({ success: true, variant }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create variant", details: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      sku?: string;
      price?: number;
      isActive?: boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Variant ID is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.sku === "string") updates.sku = body.sku.trim();
    if (typeof body.price === "number") updates.price = Math.max(0, body.price);
    if (typeof body.isActive === "boolean") updates.is_active = body.isActive;

    const { error } = await supabase.from("variants").update(updates).eq("id", body.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Variant updated." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update variant", details: message }, { status: 500 });
  }
}
