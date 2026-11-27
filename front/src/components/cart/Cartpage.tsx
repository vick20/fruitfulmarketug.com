"use client";

import { useState, type FormEvent } from "react";
import useCart from "@/src/hooks/useCart";
import CartItem from "./CartItem";
import { PanelRightClose, Trash2, MessageCircle, History } from "lucide-react";
import Link from "next/link";
import { AnimatedCartBadge, AnimatedCartCounter } from "./Animatedcart";
import { SITE_URL, WHATSAPP_PHONE } from "@/src/lib/config";
import { saveOrderToHistory } from "@/src/lib/orders/order-history";
import { toast } from "sonner";

export default function CartSlideIn({
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { cart, uiOpen, count, subtotal, isReady, clearCart } = useCart();
  const isOpen = uiOpen({ state: false, change: false });
  const hasItems = isReady && cart.items.length > 0;

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = () => {
    uiOpen({ state: false, change: true });
  };

  const handleClearCart = () => {
    clearCart();
    setIsCheckingOut(false);
    setSubmitError(null);
    toast("Cart cleared", {
      description: "All items have been removed from your basket.",
    });
  };

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasItems || isSubmitting) return;

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedEmail = customerEmail.trim();
    const trimmedAddress = shippingAddress.trim();

    if (trimmedName.length < 2) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (trimmedPhone.replace(/\D/g, "").length < 6) {
      setSubmitError("Please enter a valid phone number.");
      return;
    }
    if (trimmedAddress.length < 5) {
      setSubmitError("Please enter your delivery location/address.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: trimmedName,
          customerPhone: trimmedPhone,
          customerEmail: trimmedEmail || null,
          shippingAddress: trimmedAddress,
          items: cart.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        orderId?: string;
        totalAmount?: number;
      };

      if (!response.ok) {
        const message =
          data.error || "Unable to place your order. Please try again.";
        setSubmitError(message);
        toast.error("Order failed", { description: message });
        return;
      }

      const formattedTotal = Number(data.totalAmount ?? subtotal).toLocaleString(
        "en-UG"
      );

      const orderId = data.orderId ?? crypto.randomUUID();
      const orderUrl = `${SITE_URL}/orders/${orderId}`;
      const itemSummary = cart.items
        .map(
          (i) =>
            `- ${i.quantity}x ${i.name} @ UGX ${(
              i.unitPrice * i.quantity
            ).toLocaleString("en-UG")}`
        )
        .join("\n");

      // Save order to browser history
      saveOrderToHistory({
        orderId,
        customerName: trimmedName,
        customerPhone: trimmedPhone,
        shippingAddress: trimmedAddress,
        totalAmount: Number(data.totalAmount ?? subtotal),
        createdAt: new Date().toISOString(),
        items: cart.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      const waText = `Hello Fruitful Market UG! I have placed an order.\n\nOrder ID: #${orderId.slice(
        0,
        8
      )}\nName: ${trimmedName}\nPhone: ${trimmedPhone}\n${
        trimmedEmail ? `Email: ${trimmedEmail}\n` : ""
      }Delivery Location: ${trimmedAddress}\nTotal: UGX ${formattedTotal}\n\nItems:\n${itemSummary}\n\nView Order: ${orderUrl}`;

      const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
        waText
      )}`;

      toast.success("Order placed in system successfully!", {
        description: `Order #${orderId.slice(0, 8)} saved. WhatsApp will now open to send confirmation.`,
        duration: 20000,
        action: {
          label: "Open WhatsApp",
          onClick: () => window.open(waUrl, "_blank"),
        },
        cancel: {
          label: "Dismiss",
          onClick: () => {},
        },
      });

      // Automatically open WhatsApp to send confirmation
      window.open(waUrl, "_blank");

      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setShippingAddress("");
      setIsCheckingOut(false);
      setSubmitError(null);
      handleClose();
    } catch {
      const message =
        "Network error while placing your order. Please try again.";
      setSubmitError(message);
      toast.error("Order failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/40"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`cart-slide-in fixed top-0 z-[60] flex h-dvh w-full md:max-w-md flex-col overflow-hidden bg-white shadow-lg transition-all duration-300 ${
          isOpen ? "right-0" : "right-[-100%]"
        } ${props.className ?? ""}`}
        {...props}
      >
        <div className="cart-slide-in-header flex flex-none flex-row items-center justify-between bg-primary p-4 text-white">
          <h2 className="text-[1.25rem] font-bold">Shopping Basket</h2>
          <AnimatedCartBadge
            count={isReady ? count : 0}
            icon="basket"
            onClick={() => uiOpen({ state: true, change: true })}
          />
          <button
            type="button"
            className="close-button cursor-pointer rounded-md p-1 hover:bg-white/10"
            onClick={handleClose}
            aria-label="Close shopping basket"
          >
            <PanelRightClose size={24} />
          </button>
        </div>

        <div className="cart-slide-in-content min-h-0 flex-1 overflow-y-auto">
          {hasItems ? (
            cart.items.map((item) => (
              <CartItem key={item.variantId} item={item} />
            ))
          ) : (
            <div className="p-6 text-center space-y-4">
              <p className="text-text-muted">Your basket is empty.</p>
              <div className="pt-2">
                <Link
                  href="/orders/history"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <History className="h-3.5 w-3.5" />
                  View browser order history
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="cart-slide-in-footer flex-none border-t border-gray-200 bg-white p-6">
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-primary">Cart Summary</h3>
              <div className="flex items-center gap-3">
                <Link
                  href="/orders/history"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  title="View order history"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </Link>
                {hasItems && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    disabled={isSubmitting}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-primary">
              <span className="font-semibold">Total</span>
              <span className="inline-flex items-center gap-1 font-bold text-primary-dark tabular-nums">
                <span>UGX</span>
                <AnimatedCartCounter
                  value={isReady ? subtotal : 0}
                  formatValue={(val) => val.toLocaleString("en-UG")}
                  showPulse={false}
                  ariaLabel="Cart total"
                />
              </span>
            </div>
          </div>

          {isCheckingOut && hasItems ? (
            <form onSubmit={handlePlaceOrder} className="space-y-3">
              <p className="rounded-lg bg-emerald-50 p-2.5 text-[11px] leading-relaxed text-emerald-800">
                <strong className="font-semibold">Note:</strong> Your order is placed in our system first when you click below. WhatsApp will then open so you can send your order confirmation.
              </p>

              <div>
                <label
                  htmlFor="order-customer-name"
                  className="mb-1 block text-xs font-medium text-primary"
                >
                  Full Name (Required)
                </label>
                <input
                  id="order-customer-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sarah Namukasa"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="order-customer-phone"
                  className="mb-1 flex items-center justify-between text-xs font-medium text-primary"
                >
                  <span>Phone Number (WhatsApp - Required)</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </span>
                </label>
                <input
                  id="order-customer-phone"
                  type="tel"
                  required
                  maxLength={30}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +256 700 000000"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="order-customer-email"
                  className="mb-1 block text-xs font-medium text-primary"
                >
                  Email (Optional)
                </label>
                <input
                  id="order-customer-email"
                  type="email"
                  maxLength={150}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. sarah@example.com"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="order-shipping-address"
                  className="mb-1 block text-xs font-medium text-primary"
                >
                  Delivery Location / Address (Required)
                </label>
                <textarea
                  id="order-shipping-address"
                  required
                  minLength={5}
                  maxLength={500}
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, area, and delivery landmark"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                >
                  {submitError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckingOut(false);
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-full border border-border px-4 py-3 text-sm font-semibold text-primary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>{isSubmitting ? "PLACING ORDER..." : "PLACE ORDER VIA WHATSAPP"}</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              disabled={!hasItems}
              onClick={() => {
                setSubmitError(null);
                setIsCheckingOut(true);
              }}
              className="checkout-button w-full cursor-pointer rounded-full bg-accent px-4 py-3 font-semibold text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              MAKE ORDER
            </button>
          )}
        </div>
      </div>
    </>
  );
}
