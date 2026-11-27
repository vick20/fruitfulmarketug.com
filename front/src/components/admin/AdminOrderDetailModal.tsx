"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Phone,
  MapPin,
  MessageCircle,
  Printer,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface OrderDetailItem {
  id: string;
  productName: string;
  variantLabel: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderDetail {
  id: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  delivery: {
    id?: string | null;
    status: "pending" | "assigned" | "picked_up" | "delivered" | "failed";
    deliveredAt?: string | null;
    personnelName?: string | null;
    personnelPhone?: string | null;
  };
  items: OrderDetailItem[];
}

interface AdminOrderDetailModalProps {
  order: OrderDetail | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export default function AdminOrderDetailModal({
  order,
  onClose,
  onStatusUpdated,
}: AdminOrderDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(order?.status || "pending");
  const [selectedDelivery, setSelectedDelivery] = useState<string>(order?.delivery?.status || "pending");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  const handleSaveStatus = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          deliveryStatus: selectedDelivery,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      toast.success("Order status updated successfully.");
      onStatusUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const cleanPhone = order.customerPhone.replace(/\D/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}, this is Fruitful Market UG regarding your order #${order.id.slice(0, 8)}.`
  )}`;

  const dateStr = new Date(order.createdAt).toLocaleString("en-UG", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Order details for #${order.id.slice(0, 8)}`}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                Order #{order.id.slice(0, 8)}
              </span>
              <span className="text-xs text-text-muted">&bull;</span>
              <span className="text-xs text-text-muted">{dateStr}</span>
            </div>
            <p className="text-xs font-mono text-text-muted mt-0.5 select-all">UUID: {order.id}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Receipt"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-muted hover:text-text cursor-pointer"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-muted hover:text-text cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer & Delivery Card */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Customer Information
              </h3>
              <p className="mt-1 text-base font-bold text-primary">{order.customerName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-text hover:text-primary"
                >
                  <Phone className="h-3 w-3 text-fresh" />
                  <span>{order.customerPhone}</span>
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Delivery Location
              </h3>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-text">
                <MapPin className="h-4 w-4 shrink-0 text-fresh mt-0.5" />
                <span className="font-medium">{order.shippingAddress}</span>
              </p>
              {order.delivery?.deliveredAt && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Delivered on: {new Date(order.delivery.deliveredAt).toLocaleString("en-UG")}</span>
                </p>
              )}
            </div>
          </div>

          {/* Ordered Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Ordered Products ({order.items.length})
            </h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border">
                              <Image
                                src={item.imageUrl}
                                alt={item.productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-[10px] font-bold text-text-muted">
                              PKG
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-text">{item.productName}</p>
                            <p className="text-[11px] text-text-muted">{item.variantLabel || item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                        UGX {item.unitPrice.toLocaleString("en-UG")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary-dark tabular-nums">
                        UGX {item.subtotal.toLocaleString("en-UG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-background/50 font-bold text-sm">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-text">
                      Total Order Amount:
                    </td>
                    <td className="px-4 py-3 text-right text-primary-dark tabular-nums">
                      UGX {Number(order.totalAmount).toLocaleString("en-UG")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status & Dispatch Controls */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Update Order & Delivery Status
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Order Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Delivery Logistics
                </label>
                <select
                  value={selectedDelivery}
                  onChange={(e) => setSelectedDelivery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
                >
                  <option value="pending">Pending Assignment</option>
                  <option value="assigned">Assigned to Rider</option>
                  <option value="picked_up">Picked Up from Store</option>
                  <option value="delivered">Delivered to Customer</option>
                  <option value="failed">Failed Delivery Attempt</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? "Saving changes..." : "Save Status Updates"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
