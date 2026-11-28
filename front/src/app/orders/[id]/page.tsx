import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { getSupabaseClient } from "@/src/lib/supabase";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  quantity: number;
  unit_price_at_purchase: number;
  variants: {
    sku: string;
    products: {
      name: string;
    } | null;
  } | null;
};

async function fetchOrderDetails(orderId: string) {
  const supabase = getSupabaseAdminClient() ?? getSupabaseClient();
  if (!supabase) return null;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) return null;

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select(
      `
      id,
      quantity,
      unit_price_at_purchase,
      variants(
        sku,
        products(name)
      )
    `
    )
    .eq("order_id", orderId);

  if (itemsErr) return { order: order as OrderRow, items: [] };

  return {
    order: order as OrderRow,
    items: (items ?? []) as unknown as OrderItemRow[],
  };
}

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const title = `Order #${id.slice(0, 8)} | Fruitful Market UG`;
  const description = `View order confirmation and details for Fruitful Market UG.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Fruitful Market UG Order Confirmation",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default function OrderPage({ params }: OrderPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center text-text-muted">
          Loading order details...
        </div>
      }
    >
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: OrderPageProps) {
  const { id } = await params;
  const result = await fetchOrderDetails(id);

  if (!result) {
    notFound();
  }

  const { order, items } = result;
  const formattedDate = new Date(order.created_at).toLocaleString("en-UG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Store
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="bg-primary p-6 text-white text-center">
          <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-accent" />
          <h1 className="text-2xl font-bold">Order Confirmed!</h1>
          <p className="mt-1 text-sm text-white/80 font-mono">
            ID: {order.id}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs text-text-muted">Status</p>
              <span className="mt-0.5 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold capitalize text-primary">
                {order.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Placed on</p>
              <p className="text-sm font-medium text-text">{formattedDate}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-primary">Customer & Delivery</h2>
            <div className="rounded-xl bg-background p-4 text-sm space-y-1.5">
              <p><strong className="text-primary">Name:</strong> {order.customer_name}</p>
              <p><strong className="text-primary">Phone (WhatsApp):</strong> {order.customer_phone}</p>
              {order.customer_email && (
                <p><strong className="text-primary">Email:</strong> {order.customer_email}</p>
              )}
              <p><strong className="text-primary">Delivery Address:</strong> {order.shipping_address}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-primary">Item Summary</h2>
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {items.map((item) => {
                const productName = item.variants?.products?.name ?? "Product";
                const sku = item.variants?.sku ?? "";
                const itemTotal = item.quantity * item.unit_price_at_purchase;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3.5 bg-white text-sm">
                    <div>
                      <p className="font-semibold text-primary">{productName}</p>
                      <p className="text-xs text-text-muted">SKU: {sku} · Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-primary-dark tabular-nums">
                      UGX {itemTotal.toLocaleString("en-UG")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4 text-base font-bold text-primary">
            <span>Total Amount</span>
            <span className="text-xl text-primary-dark tabular-nums">
              UGX {Number(order.total_amount).toLocaleString("en-UG")}
            </span>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Hello Fruitful Market UG, I would like to check on Order #${order.id.slice(0, 8)}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <span>Chat with us on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

const WHATSAPP_PHONE = "256700000000";
