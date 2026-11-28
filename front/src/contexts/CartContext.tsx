'use client'
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { CartContextType, Cart, CartItem, createEmptyCart } from "../lib/cart/cart-types";
import { readStoredCart, storeCart } from "../lib/cart/cart-store";
import { PriceCalculator } from "../lib/cart/price-calculator";
import Logger from "../utils/Logger";
import { toast } from "sonner";

export const CartContext = createContext<CartContextType | null>(null);

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<Cart>(() => createEmptyCart());
  const [isReady, setIsReady] = useState<boolean>(false);
  const [Open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const stored = readStoredCart();
    if (stored && stored.items && stored.items.length > 0) {
      setCart(stored);
    }
    setIsReady(true);
  }, []);

  const count = useMemo(
    () => PriceCalculator.calculateItemCount(cart.items),
    [cart.items]
  );

  const subtotal = useMemo(
    () => PriceCalculator.calculateCartSubtotal(cart.items),
    [cart.items]
  );

  // persist the cart changes
  useEffect(() => {
    if (isReady) {
      storeCart({ ...cart, count, subtotal });
    }
  }, [cart, count, subtotal, isReady]);

  // add cart item
  const addItem = useCallback((item: CartItem) => {
    Logger.getInstance().info('Adding item to cart:', item);
    const itemSubtotal = PriceCalculator.calculateItemSubtotal(item);

    setCart(prev => {
      const exists = prev.items?.some(i => i.variantId === item.variantId);
      Logger.getInstance().info('Item exists in cart:', exists);
      const items = exists
        ? prev.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )
        : [...prev.items, item];

      Logger.getInstance().info('Updated cart items:', items);
      return {
        ...prev,
        items,
        updatedAt: new Date().toISOString(),
      };
    });

    toast.success(`${item.name} added to cart`, {
      duration: 20000,
      description: `UGX ${itemSubtotal.toLocaleString("en-UG")} · Qty ${item.quantity}`,
      action: {
        label: "View Basket",
        onClick: () => setOpen(true),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  }, []);

  // remove item
  const removeItem = useCallback((variantId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(it => variantId !== it.variantId),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // update quantity
  const updateQuantity = useCallback((variantId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(variantId);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.variantId === variantId ? { ...item, quantity: qty } : item
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, [removeItem]);

  // clear cart
  const clearCart = useCallback(() => {
    setCart(prev => ({
      ...prev,
      items: [],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateSubtotal = useCallback((): number => {
    return subtotal;
  }, [subtotal]);

  const uiOpen = useCallback(
    ({ state, change }: { state: boolean; change: boolean }): boolean => {
      if (change) {
        setOpen(state);
      }
      return Open;
    },
    [Open]
  );

  const value: CartContextType = useMemo(
    () => ({
      cart,
      count,
      subtotal,
      isReady,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      updateSubtotal,
      uiOpen,
    }),
    [cart, count, subtotal, isReady, addItem, removeItem, updateQuantity, clearCart, updateSubtotal, uiOpen]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
