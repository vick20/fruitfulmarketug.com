import { Suspense } from "react";
import Link from "next/link";
import { ListFilter } from "lucide-react";
import ProductGrid from "../../components/product/productGrid";
import { getProducts } from "../../lib/product/productsProvider";

type ProductsPageProps = {
  searchParams: Promise<{
    page?: string;
    category?: string;
    q?: string;
  }>;
};

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-text-muted">
          Loading products...
        </div>
      }
    >
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsContent({ searchParams }: ProductsPageProps) {
  const resolved = await searchParams;
  const requestedPage = Number(resolved.page ?? "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const category = resolved.category?.trim() || null;
  const search = resolved.q?.trim() || null;

  const { items, page, totalPages } = await getProducts({
    page: currentPage,
    pageSize: 12,
    filters: category ? { categories: [category] } : undefined,
    search,
  });

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    if (category) params.set("category", category);
    if (search) params.set("q", search);
    return `/products?${params.toString()}`;
  };

  return (
    <>
      <header className="flex flex-row items-center align-center justify-between gap-2 p-5">
        <h2 className="text-lg font-bold">All Products</h2>
        <button className="bg-primary text-text-light rounded-md flex flex-row px-3 py-2 items-center gap-2 ">
          <ListFilter /> Filters
        </button>
      </header>

      <div className="gridview-container px-2">
        <ProductGrid products={items} columns={2} />
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-center gap-4 py-8"
        >
          {page > 1 ? (
            <Link
              href={buildPageHref(page - 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted opacity-50">
              Previous
            </span>
          )}
          <span className="text-sm font-medium text-primary">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildPageHref(page + 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted opacity-50">
              Next
            </span>
          )}
        </nav>
      )}
    </>
  );
}
