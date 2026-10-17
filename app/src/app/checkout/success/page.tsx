import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { OrderConfirmation } from "./OrderConfirmation";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<Container className="py-16 text-center text-muted">Loading your order…</Container>}>
      <OrderConfirmation />
    </Suspense>
  );
}
