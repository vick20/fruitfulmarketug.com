"use client";

import { useState } from "react";
import { Check, ShoppingBasket, Minimize2 } from "lucide-react";
import useCart from "@/src/hooks/useCart";
import { useHasHydrated } from "@/src/hooks/useHasHydrated";
import { PriceCalculator } from "@/src/lib/cart/price-calculator";
import type { ProductCardData, VariantWithAttributes } from "./types/product";
import { AnimatedCartCounter, CartQuantityStepper } from "../cart/Animatedcart";

interface ProductCartActionsProps {
  product: ProductCardData;
  variants: VariantWithAttributes[];
}

function getVariantEffectivePrice(variant: VariantWithAttributes): number {
  const pricedAttr = variant.attributes.find(
    (attr) => attr.price !== null && attr.price !== undefined
  );
  return Number(pricedAttr ? pricedAttr.price : variant.price);
}

function getVariantLabel(variant: VariantWithAttributes): string {
  if (variant.attributes.length > 0) {
    return variant.attributes
      .map((attribute) => `${attribute.name}: ${attribute.value}`)
      .join(" · ");
  }
  return variant.sku;
}

export default function ProductCartActions({
  product,
  variants,
}: ProductCartActionsProps) {
  const { cart, addItem, updateQuantity } = useCart();
  const hasHydrated = useHasHydrated();
  const [selectedVariantId, setSelectedVariantId] = useState(
    String(variants[0]?.id ?? "")
  );
  const [isFabExpanded, setIsFabExpanded] = useState(false);

  const selectedVariant =
    variants.find((variant) => String(variant.id) === selectedVariantId) ??
    variants[0];

  const activeVariantId = selectedVariant ? String(selectedVariant.id) : "";
  const cartItem = hasHydrated
    ? cart.items.find((item) => item.variantId === activeVariantId)
    : undefined;
  const image = product.images[0];

  if (!selectedVariant) {
    return (
      <p className="text-sm text-text-muted">
        This product is currently unavailable.
      </p>
    );
  }

  const effectivePrice = getVariantEffectivePrice(selectedVariant);
  const selectedLabel = getVariantLabel(selectedVariant);
  const currentItemSubtotal = cartItem
    ? PriceCalculator.calculateItemSubtotal(cartItem)
    : effectivePrice;

  const handleAddToBasket = () => {
    addItem({
      variantId: activeVariantId,
      productId: String(selectedVariant.product_id),
      name: `${product.name}${selectedLabel ? ` (${selectedLabel})` : ""}`,
      image: image?.url ?? "",
      unitPrice: effectivePrice,
      quantity: 1,
    });
  };

  return (
    <>
      <div className="space-y-4">
        {/* Selected price summary (Desktop & inline reference) */}
        <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
          <div>
            <p className="text-xs font-medium text-text-muted">
              Selected price
            </p>
            <p className="mt-0.5 inline-flex items-baseline gap-1.5 text-2xl font-bold text-primary-dark tabular-nums">
              <span>UGX</span>
              <AnimatedCartCounter
                value={effectivePrice}
                formatValue={(val) => val.toLocaleString("en-UG")}
                showPulse={false}
                ariaLabel="Selected variant price"
              />
            </p>
          </div>
          <span className="text-xs text-text-muted tabular-nums">
            SKU: {selectedVariant.sku}
          </span>
        </div>

        {/* Interactive Variants Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-primary">
              Available options ({variants.length})
            </h2>
            <span className="text-xs text-text-muted truncate max-w-[60%]">
              {selectedLabel}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label={`Select option for ${product.name}`}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {variants.map((variant) => {
              const id = String(variant.id);
              const isSelected = id === activeVariantId;
              const label = getVariantLabel(variant);
              const price = getVariantEffectivePrice(variant);

              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedVariantId(id)}
                  className={`flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/[0.06] ring-2 ring-primary/25"
                      : "border-border bg-white hover:border-primary/40 hover:bg-background"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <Check
                          className="h-4 w-4 shrink-0 text-primary"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`truncate text-sm font-semibold ${
                          isSelected ? "text-primary" : "text-text"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-muted tabular-nums">
                      SKU: {variant.sku}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      isSelected ? "text-primary-dark" : "text-text"
                    }`}
                  >
                    UGX {price.toLocaleString("en-UG")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop inline CTA */}
        <div className="hidden md:block pt-2">
          {cartItem ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-2.5">
              <span className="text-sm font-medium text-primary">
                In your basket (Total: UGX {currentItemSubtotal.toLocaleString("en-UG")})
              </span>
              <CartQuantityStepper
                min={1}
                max={100}
                value={cartItem.quantity}
                onChange={(quantity) =>
                  updateQuantity(activeVariantId, quantity)
                }
                itemName={product.name}
                size="md"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToBasket}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-dark active:scale-[0.99]"
              aria-label={`Add ${product.name}, ${selectedLabel} to basket`}
            >
              <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
              <span>Add to basket</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile FAB / Expandable Bottom Purchase Bar */}
      <div className="md:hidden">
        {/* Collapsed FAB Button */}
        {!isFabExpanded && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFabExpanded(true)}
              aria-label="Open purchase options"
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            >
              <ShoppingBasket className="h-6 w-6 text-accent" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Expanded FAB Overlay & Bottom Sheet */}
        {isFabExpanded && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsFabExpanded(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-white p-5 shadow-2xl transition-transform duration-300">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-primary">{product.name}</h3>
                  <p className="text-xs text-text-muted">{selectedLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFabExpanded(false)}
                  aria-label="Shrink purchase bar"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background text-primary hover:bg-primary/10"
                >
                  <Minimize2 className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-text-muted">Total Price</span>
                  <span className="text-xl font-bold text-primary-dark tabular-nums">
                    UGX {currentItemSubtotal.toLocaleString("en-UG")}
                  </span>
                </div>

                {cartItem ? (
                  <div className="flex items-center justify-between rounded-xl bg-background p-3">
                    <span className="text-sm font-medium text-primary">Quantity</span>
                    <CartQuantityStepper
                      min={1}
                      max={100}
                      value={cartItem.quantity}
                      onChange={(quantity) =>
                        updateQuantity(activeVariantId, quantity)
                      }
                      itemName={product.name}
                      size="md"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToBasket();
                      setIsFabExpanded(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                  >
                    <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
                    <span>Add to basket</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
