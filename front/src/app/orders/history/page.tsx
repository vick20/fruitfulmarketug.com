"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackageCheck, ShoppingBag } from "lucide-react";
import { getStoredOrderHistory, type StoredOrder } from "@/src/lib/orders/order-history";
import { WHATSAPP_PHONE } from "@/src/lib/config";

export default function OrderHistoryPage() {
  const [orders] = useState<StoredOrder[]>(() => getStoredOrderHistory());
  const isLoaded = true;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Store
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          <span>Shop products</span>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">Browser Order History</h1>
        <p className="mt-1 text-sm text-text-muted">
          Orders placed from this browser session are securely saved locally.
        </p>
      </div>

      {!isLoaded ? (
        <div className="py-12 text-center text-text-muted">Loading order history...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <PackageCheck className="mx-auto mb-3 h-12 w-12 text-text-muted/50" />
          <h2 className="text-lg font-semibold text-primary">No past orders found</h2>
          <p className="mt-1 text-sm text-text-muted">
            When you place orders on Fruitful Market UG, they will appear here.
          </p>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-primary shadow-sm hover:opacity-90"
            >
              Start shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleString("en-UG", {
              dateStyle: "medium",
              timeStyle: "short",
            });
            const waText = `Hello Fruitful Market UG, checking on Order #${order.orderId.slice(0, 8)}.`;
            const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(waText)}`;

            return (
              <div
                key={order.orderId}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-5 py-3.5 text-xs text-text-muted">
                  <div>
                    <span className="font-semibold text-primary">Order ID:</span>{" "}
                    <span className="font-mono">{order.orderId}</span>
                  </div>
                  <div>{dateStr}</div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-primary">
                        {order.customerName} · {order.customerPhone}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Delivery to: {order.shippingAddress}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Total Amount</p>
                      <p className="text-lg font-bold text-primary-dark tabular-nums">
                        UGX {Number(order.totalAmount).toLocaleString("en-UG")}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background p-3 text-xs space-y-1.5">
                    <p className="font-semibold text-primary">Items ({order.items.length}):</p>
                    <ul className="divide-y divide-border/50">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between py-1 first:pt-0 last:pb-0">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium tabular-nums">
                            UGX {(item.unitPrice * item.quantity).toLocaleString("en-UG")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Link
                      href={`/orders/${order.orderId}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View confirmation page &rarr;
                    </Link>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
