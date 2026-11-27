'use client'
import useCart from '../../hooks/useCart';
import { useHasHydrated } from '../../hooks/useHasHydrated';
import Image from "next/image";
import Link from "next/link";
import { ProductCardData,VariantWithAttributes, ProductImage} from "./types/product";
import { toCartitem } from '@/src/lib/product/ProductWrapper';
import { createProductJsonLd } from '@/src/lib/product/product-schema';
import { CartQuantityStepper } from '../cart/Animatedcart';
import { ShoppingBasket } from 'lucide-react';

interface ProductCardProps {
  product: ProductCardData;
}

export default function ProductCard({ product }: ProductCardProps) {
  const images: ProductImage[] = product.images;
  const variants: VariantWithAttributes[] = product.variants;
  const { cart, addItem, updateQuantity } = useCart();
  const hasHydrated = useHasHydrated();
  const cartItem = toCartitem(product);
  const existingCartItem = hasHydrated
    ? cart.items.find((item) => item.variantId === cartItem.variantId)
    : undefined;
  const productJsonLd = createProductJsonLd(product);
  const productPrices = variants
    .filter((variant) => variant.is_active)
    .flatMap((variant) =>
      variant.attributes.length > 0
        ? variant.attributes.map((attribute) => attribute.price ?? variant.price)
        : [variant.price],
    )
    .filter((price) => Number.isFinite(price) && price >= 0);
  const displayedPrices =
    productPrices.length > 0 ? productPrices : [product.base_price];
  const minPrice = Math.min(...displayedPrices);
  const maxPrice = Math.max(...displayedPrices);
  const formatPrice = (price: number) => `UGX ${price.toLocaleString("en-UG")}`;

  return (
    <article
      aria-labelledby={`product-title-${product.id}`}
      className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Product image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-background">
        <Link
          href={`/products/${product.id}`}
          tabIndex={-1}
          aria-label={`View ${product.name}`}
          className="relative block h-full w-full"
        >
          {images[0]?.url ? (
            <Image
              src={images[0].url}
              alt={images[0].alt_text?.trim() || product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full bg-background"
            />
          )}

          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
            Fresh
          </span>
        </Link>

        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white text-text shadow-sm hover:text-primary"
        >
          <span aria-hidden="true">♡</span>
        </button>
      </div>

      {/* Product information */}
      <div className="space-y-3 p-3">
        <Link
          href={`/products/${product.id}`}
          className="block space-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        >
          <div>
            {product.categories[0] && (
              <p className="text-xs text-text-muted">
                {product.categories[0].name}
              </p>
            )}
            <h3
              id={`product-title-${product.id}`}
              className="font-semibold text-text transition-colors group-hover:text-primary"
            >
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                {product.description}
              </p>
            )}
          </div>

          {/* Price and stock */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-primary-dark">
              {productPrices.length > 0
                ? minPrice === maxPrice
                  ? formatPrice(minPrice)
                  : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                : formatPrice(product.base_price)}
            </span>
          </div>
        </Link>

        <div>
          {existingCartItem ? (
            <div className="flex justify-end">
              <CartQuantityStepper
                min={1}
                max={100}
                value={existingCartItem.quantity}
                onChange={(quantity) =>
                  updateQuantity(cartItem.variantId, quantity)
                }
                size="sm"
                itemName={product.name}
              />
            </div>
          ) : (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              onClick={() => addItem({ ...cartItem, quantity: 1 })}
              aria-label={`Add ${product.name} to basket`}
            >
              <span>+</span>
              Add to <ShoppingBasket size={16} aria-hidden="true" />
            </button>
          )}
        </div>

      </div>
    </article>
  );
}
