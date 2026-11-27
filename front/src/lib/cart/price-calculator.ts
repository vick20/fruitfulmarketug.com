import type { CartItem } from "./cart-types";

export class PriceCalculator {
  /**
   * Calculates the subtotal for a single cart item (unitPrice * quantity).
   */
  static calculateItemSubtotal(item: CartItem): number {
    const unit = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;
    return Math.max(0, Math.round(unit * qty * 100) / 100);
  }

  /**
   * Calculates the total subtotal across all cart items.
   */
  static calculateCartSubtotal(items: CartItem[]): number {
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (sum, item) => sum + PriceCalculator.calculateItemSubtotal(item),
      0
    );
  }

  /**
   * Calculates the total unique item count (or total qty if needed).
   */
  static calculateItemCount(items: CartItem[]): number {
    if (!Array.isArray(items)) return 0;
    return items.length;
  }
}
