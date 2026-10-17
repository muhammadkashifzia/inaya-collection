"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, FormAlert } from "@/components/atoms";
import { OrderSummaryCard } from "@/components/organisms/OrderSummaryCard";
import { api, ApiError } from "@/lib/api";
import type { Order } from "@/types";
import { AccountShell } from "../../AccountShell";

export function OrderDetail() {
  const { number } = useParams<{ number: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.order(number).then(setOrder).catch((e) => setError(e instanceof ApiError && e.status === 403 ? "This order doesn't belong to your account." : "Could not load this order."));
  }, [number]);

  async function cancel() {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    try {
      setOrder(await api.cancelOrder(number));
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("status") ?? e.message) : "Could not cancel the order.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <AccountShell title="Order details">
      <p className="mb-6 text-sm"><Link href="/account/orders" className="underline">← All orders</Link></p>
      <FormAlert tone="error">{error}</FormAlert>
      {order && (
        <div className="space-y-6">
          <OrderSummaryCard order={order} />
          {order.canCancel && (
            <Button variant="outline" onClick={cancel} disabled={cancelling} aria-busy={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel order"}
            </Button>
          )}
        </div>
      )}
      {!order && !error && <p className="text-muted">Loading order…</p>}
    </AccountShell>
  );
}
