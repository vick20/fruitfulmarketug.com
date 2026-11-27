import { mockProducts } from "../../test/productMokeData";
import type { ProductCardData } from "../../components/product/types/product";
import {
  getProductByIdOrSlugFromSupabase,
  getProductsFlexible,
  hasSupabaseConfig,
  type PaginatedProductsResponse,
} from "../supabase";

export interface filters {
  categories?: string[];
  price?: { minPrice: number; maxPrice: number };
}

export interface ProductRequestParams {
  test?: boolean;
  filters?: filters;
  page?: number;
  pageSize?: number;
  search?: string | null;
  sortBy?: "name" | "base_price" | "created_at";
  ascending?: boolean;
}

export type PaginatedProductsResult = PaginatedProductsResponse;

function applyLocalFiltersAndPaginate(
  source: ProductCardData[],
  {
    filters,
    page = 1,
    pageSize = 12,
    search = null,
    sortBy = "name",
    ascending = true,
  }: Omit<ProductRequestParams, "test">
): PaginatedProductsResult {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(pageSize, 100));

  let filtered = [...source];

  if (filters?.categories && filters.categories.length > 0) {
    const wanted = new Set(filters.categories.map((c) => c.toLowerCase()));
    filtered = filtered.filter((product) =>
      product.categories.some(
        (cat) =>
          wanted.has(cat.slug.toLowerCase()) ||
          wanted.has(cat.name.toLowerCase())
      )
    );
  }

  if (filters?.price) {
    const { minPrice, maxPrice } = filters.price;
    filtered = filtered.filter(
      (product) =>
        product.base_price >= minPrice && product.base_price <= maxPrice
    );
  }

  if (search && search.trim().length > 0) {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        (product.description ?? "").toLowerCase().includes(term)
    );
  }

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "base_price") {
      cmp = a.base_price - b.base_price;
    } else if (sortBy === "name") {
      cmp = a.name.localeCompare(b.name);
    }
    if (cmp === 0) {
      cmp = String(a.id).localeCompare(String(b.id));
    }
    return ascending ? cmp : -cmp;
  });

  const totalCount = filtered.length;
  const from = (safePage - 1) * safeLimit;
  const items = filtered.slice(from, from + safeLimit);

  return {
    items,
    page: safePage,
    pageSize: safeLimit,
    totalCount,
    totalPages: Math.ceil(totalCount / safeLimit),
  };
}

export async function getProducts(
  paramsOrTest: ProductRequestParams | boolean = {}
): Promise<PaginatedProductsResult> {
  const params: ProductRequestParams =
    typeof paramsOrTest === "boolean" ? { test: paramsOrTest } : paramsOrTest;

  if (params.test) {
    return applyLocalFiltersAndPaginate(mockProducts, params);
  }

  return fetchProductsFromDB(params);
}

// fetch from the database (Supabase)
async function fetchProductsFromDB(
  params: ProductRequestParams = {}
): Promise<PaginatedProductsResult> {
  if (!hasSupabaseConfig()) {
    console.warn(
      "[productsProvider] Supabase env vars not set; falling back to mock products."
    );
    return applyLocalFiltersAndPaginate(mockProducts, params);
  }

  const singleCategorySlug =
    params.filters?.categories?.length === 1
      ? params.filters.categories[0]
      : null;

  try {
    const result = await getProductsFlexible({
      page: params.page,
      pageSize: params.pageSize,
      categorySlug: singleCategorySlug,
      search: params.search,
      sortBy: params.sortBy,
      ascending: params.ascending,
    });

    let items = result.items;

    if (params.filters?.categories && params.filters.categories.length > 1) {
      const wanted = new Set(
        params.filters.categories.map((c) => c.toLowerCase())
      );
      items = items.filter((product) =>
        product.categories.some((cat) => wanted.has(cat.slug.toLowerCase()))
      );
    }

    if (params.filters?.price) {
      const { minPrice, maxPrice } = params.filters.price;
      items = items.filter(
        (product) =>
          product.base_price >= minPrice && product.base_price <= maxPrice
      );
    }

    return {
      items,
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  } catch (err) {
    console.warn("[productsProvider] Supabase fetch failed; falling back to mock products.", err);
    return applyLocalFiltersAndPaginate(mockProducts, params);
  }
}

export async function getProductById(
  idOrSlug: string,
  test = false
): Promise<ProductCardData | undefined> {
  if (test || !hasSupabaseConfig()) {
    return (
      mockProducts.find(
        (p) => p.slug === idOrSlug || String(p.id) === idOrSlug
      ) ?? mockProducts.at(0)
    );
  }

  try {
    const product = await getProductByIdOrSlugFromSupabase(idOrSlug);
    return product ?? undefined;
  } catch (err) {
    console.warn("[productsProvider] Supabase single product fetch failed; falling back to mock products.", err);
    return (
      mockProducts.find(
        (p) => p.slug === idOrSlug || String(p.id) === idOrSlug
      ) ?? mockProducts.at(0)
    );
  }
}