import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/src/lib/admin/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ categories: [], connected: false });
  }

  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, slug, created_at")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    // Also get product count per category
    const { data: mappings } = await supabase
      .from("product_categories")
      .select("category_id");

    const counts: Record<string, number> = {};
    for (const m of mappings ?? []) {
      counts[m.category_id] = (counts[m.category_id] ?? 0) + 1;
    }

    const result = (categories ?? []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      createdAt: cat.created_at,
      productsCount: counts[cat.id] ?? 0,
    }));

    return NextResponse.json({ categories: result, connected: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch categories", details: message }, { status: 500 });
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
    const body = (await request.json()) as { name?: string; slug?: string };
    const name = body.name?.trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Category name must be at least 2 characters." }, { status: 400 });
    }

    const slug = (body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));

    const { data, error } = await supabase
      .from("categories")
      .insert({ name, slug })
      .select("id, name, slug, created_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create category", details: message }, { status: 500 });
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
    const body = (await request.json()) as { id?: string; name?: string; slug?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.slug?.trim()) updates.slug = body.slug.trim();

    const { error } = await supabase.from("categories").update(updates).eq("id", body.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Category updated." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update category", details: message }, { status: 500 });
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
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Category deleted." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete category", details: message }, { status: 500 });
  }
}
