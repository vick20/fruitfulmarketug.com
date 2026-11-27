import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCartActions from "@/src/components/product/ProductCartActions";
import ProductGallery from "@/src/components/product/ProductGallery";
import type { ProductCardData } from "@/src/components/product/types/product";
import { getProductById } from "@/src/lib/product/productsProvider";
import { createProductJsonLd } from "@/src/lib/product/product-schema";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};
async function getProduct(id: string): Promise<ProductCardData | undefined> {
  return getProductById(id);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product not found | Fruitful Market UG" };
  }

  return {
    title: `${product.name} | Fruitful Market UG`,
    description:
      product.description ?? `Shop ${product.name} at Fruitful Market UG.`,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Fruitful Market UG`,
      description:
        product.description ?? `Shop ${product.name} at Fruitful Market UG.`,
      type: "website",
      images: product.images.map((image) => ({
        url: image.url,
        alt: image.alt_text ?? product.name,
      })),
    },
  };
}

export default function ProductDetailsPage({ params }: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <section className="container mx-auto max-w-6xl px-4 py-8 text-text-muted">
          Loading product...
        </section>
      }
    >
      <ProductDetailsContent params={params} />
    </Suspense>
  );
}

async function ProductDetailsContent({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const productJsonLd = createProductJsonLd(product);
  const jsonLd = JSON.stringify(productJsonLd).replace(/</g, "\\u003c");
  const activeVariants = product.variants.filter((variant) => variant.is_active);

  return (
    <section
      aria-labelledby="product-page-title"
      className="container mx-auto max-w-6xl px-4 py-5 pb-8 md:py-8 md:pb-12"
    >
      <nav aria-label="Breadcrumb" className="mb-4 md:mb-6 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true" className="px-2">
          /
        </span>
        <Link href="/products" className="hover:text-primary">
          Products
        </Link>
        <span aria-hidden="true" className="px-2">
          /
        </span>
        <span aria-current="page" className="text-text font-medium">
          {product.name}
        </span>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
        <div className="md:sticky md:top-20">
          <ProductGallery productName={product.name} images={product.images} />
        </div>

        <div className="space-y-5">
          <div>
            {product.categories[0] && (
              <p className="mb-1 text-xs font-medium tracking-wide text-text-muted">
                {product.categories[0].name}
              </p>
            )}
            <h1
              id="product-page-title"
              className="text-2xl font-bold text-primary md:text-4xl text-balance"
            >
              {product.name}
            </h1>
          </div>

          <ProductCartActions product={product} variants={activeVariants} />

          {product.description && (
            <div className="border-t border-border pt-4">
              <h2 className="mb-1.5 text-sm font-semibold text-primary">
                About this item
              </h2>
              <p className="leading-relaxed text-sm md:text-base text-text-muted">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
