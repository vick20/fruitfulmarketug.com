import React from "react";
import AdminOrders from "@/src/components/admin/AdminOrders";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminOrders isSoundEnabled={true} initialOrderId={id} />;
}
