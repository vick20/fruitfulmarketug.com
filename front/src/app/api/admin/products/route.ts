import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/src/lib/admin/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ products: [], connected: false });
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        description,
        base_price,
        is_active,
        created_at,
        categories (
          id,
          name,
          slug
        ),
        variants (
          id,
          sku,
          price,
          is_active
        ),
        product_images (
          id,
          url,
          alt_text
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const products = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      basePrice: Number(p.base_price),
      isActive: p.is_active,
      createdAt: p.created_at,
      categories: Array.isArray(p.categories) ? p.categories : [],
      variants: Array.isArray(p.variants) ? p.variants : [],
      images: Array.isArray(p.product_images) ? p.product_images : [],
    }));

    return NextResponse.json({ products, connected: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch products", details: message }, { status: 500 });
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
      name?: string;
      slug?: string;
      description?: string;
      basePrice?: number;
      categoryId?: string;
      imageUrl?: string;
      variantSku?: string;
      variantPrice?: number;
    };

    const name = body.name?.trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Product name must be at least 2 characters." }, { status: 400 });
    }

    const slug = (body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    const basePrice = Math.max(0, Number(body.basePrice) || 0);

    // 1. Insert into products
    const { data: newProduct, error: prodError } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        description: body.description?.trim() || null,
        base_price: basePrice,
        is_active: true,
      })
      .select("id, name, slug, base_price, is_active, created_at")
      .single();

    if (prodError || !newProduct) {
      throw prodError || new Error("Failed to insert product record");
    }

    // 2. Link category if specified
    if (body.categoryId) {
      await supabase.from("product_categories").insert({
        product_id: newProduct.id,
        category_id: body.categoryId,
      });
    }

    // 3. Create default variant
    const sku = (body.variantSku?.trim() || `${slug.substring(0, 5).toUpperCase()}-STD-${Date.now().toString().slice(-4)}`);
    const varPrice = Math.max(0, Number(body.variantPrice) || basePrice);

    await supabase.from("variants").insert({
      product_id: newProduct.id,
      sku,
      price: varPrice,
      is_active: true,
    });

    // 4. Save image if provided
    if (body.imageUrl?.trim()) {
      await supabase.from("product_images").insert({
        product_id: newProduct.id,
        url: body.imageUrl.trim(),
        alt_text: name,
        sort_order: 0,
      });
    }

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create product", details: message }, { status: 500 });
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
      name?: string;
      slug?: string;
      description?: string;
      basePrice?: number;
      isActive?: boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.slug === "string") updates.slug = body.slug.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (typeof body.basePrice === "number") updates.base_price = Math.max(0, body.basePrice);
    if (typeof body.isActive === "boolean") updates.is_active = body.isActive;

    const { error } = await supabase.from("products").update(updates).eq("id", body.id);
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "Product updated successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update product", details: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client not configured" }, { status: 503 });
  }

  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    // Toggle active false for safe soft-delete
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "Product deactivated." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to deactivate product", details: message }, { status: 500 });
  }
}
