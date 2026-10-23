"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink, Container, Heading, Icon } from "@/components/atoms";
import { OrderSummaryCard } from "@/components/organisms/OrderSummaryCard";
import { useStore } from "@/context/StoreProvider";
import { api } from "@/lib/api";
import type { Order } from "@/types";

/**
 * Shows the order returned by checkout (kept in sessionStorage for this tab).
 * Signed-in customers can also reload it from their account.
 */
export function OrderConfirmation() {
  const params = useSearchParams();
  const number = params.get("order") ?? "";
  const { user, authReady } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!number || !authReady) return;
    const stored = sessionStorage.getItem(`gw-order-${number}`);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from sessionStorage (browser-only)
        setOrder(JSON.parse(stored) as Order);
        return;
      } catch {
        sessionStorage.removeItem(`gw-order-${number}`);
      }
    }
    if (user) {
      api.order(number).then(setOrder).catch(() => setMissing(true));
    } else {
      setMissing(true);
    }
  }, [number, user, authReady]);

  return (
    <Container className="max-w-3xl py-12">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Icon name="check" size={28} />
        </span>
        <Heading level={1} align="center">Thank you for your order</Heading>
        {number && (
          <p className="mt-2 text-muted">
            Your order number is <strong className="text-ink">{number}</strong>. Keep it to track your delivery.
          </p>
        )}
      </div>

      {order && <OrderSummaryCard order={order} />}
      {missing && (
        <p className="text-center text-sm text-muted">
          You can look up this order anytime from the <Link href="/pages/track-your-order" className="underline">Track your order</Link> page.
        </p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/collections/all" variant="outline">Continue shopping</ButtonLink>
        {user && <ButtonLink href="/account/orders">View my orders</ButtonLink>}
      </div>
    </Container>
  );
}
