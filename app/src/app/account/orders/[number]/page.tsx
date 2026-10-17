import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { OrderDetail } from "./OrderDetail";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<Container className="py-16 text-center text-muted">Loading order…</Container>}>
      <OrderDetail />
    </Suspense>
  );
}
