import { cacheLife } from "next/cache";
import type {
  Category,
  ProductCardData,
  ProductImage,
  VariantAttribute,
  VariantWithAttributes,
} from "@/src/components/product/types/product";
import { getSupabaseClient } from "./client";

export type StorefrontQueryOptions = {
  page?: number;
  pageSize?: number;
  categorySlug?: string | null;
  search?: string | null;
  sortBy?: "name" | "base_price" | "created_at";
  ascending?: boolean;
};

type SupabaseCategoryRow = {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
};

type SupabaseProductImageRow = {
  id: number;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at?: string;
};

type SupabaseVariantAttributeRow = {
  id: number;
  name: string;
  value: string;
  price: number | null;
};

type SupabaseVariantRow = {
  id: number;
  sku: string;
  price: number;
  is_active: boolean;
  created_at?: string;
  variant_attributes?: SupabaseVariantAttributeRow[] | null;
};

type SupabaseProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  created_at?: string;
  categories?: SupabaseCategoryRow[] | null;
  product_images?: SupabaseProductImageRow[] | null;
  variants?: SupabaseVariantRow[] | null;
};

export interface PaginatedProductsResponse {
  items: ProductCardData[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function mapSupabaseProductToCardData(
  product: SupabaseProductRow
): ProductCardData {
  const categories: Category[] = (product.categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    created_at: cat.created_at ?? "",
  }));

  const images: ProductImage[] = [...(product.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      product_id: product.id,
      url: img.url,
      alt_text: img.alt_text ?? null,
      sort_order: img.sort_order,
      created_at: img.created_at ?? "",
    }));

  const variants: VariantWithAttributes[] = (product.variants ?? [])
    .filter((v) => v.is_active)
    .map((variant) => {
      const attributes: VariantAttribute[] = (
        variant.variant_attributes ?? []
      ).map((attr) => ({
        id: attr.id,
        variant_id: variant.id,
        name: attr.name,
        value: attr.value,
        price: attr.price ?? null,
      }));

      return {
        id: variant.id,
        product_id: product.id,
        sku: variant.sku,
        price: variant.price,
        is_active: variant.is_active,
        created_at: variant.created_at ?? "",
        attributes,
      };
    });

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    base_price: product.base_price,
    categories,
    images,
    variants,
  };
}

export async function getProductsFlexible({
  page = 1,
  pageSize = 12,
  categorySlug = null,
  search = null,
  sortBy = "name",
  ascending = true,
}: StorefrontQueryOptions = {}): Promise<PaginatedProductsResponse> {
  "use cache";
  cacheLife({
    stale: 60,
    revalidate: 30,
    expire: 3600,
  });

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured."
    );
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(pageSize, 100));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  // Use !inner on categories only when filtering by category so products
  // without a matching category aren't excluded on unfiltered requests.
  const categorySelect = categorySlug
    ? "categories!inner(id, name, slug)"
    : "categories(id, name, slug)";

  let query = supabase
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
      ${categorySelect},
      product_images(id, url, alt_text, sort_order, created_at),
      variants(
        id,
        sku,
        price,
        is_active,
        created_at,
        variant_attributes(id, name, value, price)
      )
    `,
      { count: "exact" }
    )
    .eq("is_active", true);

  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error, count } = await query
    .order(sortBy, { ascending })
    .order("id", { ascending: true }) // tie-breaker for stable pagination
    .range(from, to);

  if (error) throw error;

  const rows = (data ?? []) as unknown as SupabaseProductRow[];
  const items = rows.map(mapSupabaseProductToCardData);
  const totalCount = count ?? 0;

  return {
    items,
    page: safePage,
    pageSize: safeLimit,
    totalCount,
    totalPages: Math.ceil(totalCount / safeLimit),
  };
}

export async function getProductByIdOrSlugFromSupabase(
  idOrSlug: string
): Promise<ProductCardData | null> {
  "use cache";
  cacheLife({
    stale: 60,
    revalidate: 30,
    expire: 3600,
  });

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured."
    );
  }

  const isNumericId = /^\d+$/.test(idOrSlug);
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );
  let query = supabase
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
      categories(id, name, slug),
      product_images(id, url, alt_text, sort_order, created_at),
      variants(
        id,
        sku,
        price,
        is_active,
        created_at,
        variant_attributes(id, name, value, price)
      )
    `
    )
    .eq("is_active", true);

  query = isNumericId
    ? query.eq("id", Number(idOrSlug))
    : isUuid
    ? query.eq("id", idOrSlug)
    : query.eq("slug", idOrSlug);

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapSupabaseProductToCardData(data as unknown as SupabaseProductRow);
}
