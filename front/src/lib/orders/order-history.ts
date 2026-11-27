export interface StoredOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

const ORDER_HISTORY_KEY = "fruitfulmarket_order_history";

export function getStoredOrderHistory(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDER_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrderToHistory(order: StoredOrder) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredOrderHistory();
    const updated = [order, ...existing.filter((o) => o.orderId !== order.orderId)].slice(0, 50);
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save order to local history:", err);
  }
}
