"use client";

import { useState } from "react";
import { Button, FormAlert, TextField } from "@/components/atoms";
import { OrderSummaryCard } from "@/components/organisms/OrderSummaryCard";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import type { Order } from "@/types";

/** Guest order lookup: order number + the email or phone used at checkout. */
export function TrackOrderForm() {
  const toast = useToast();
  const [number, setNumber] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      setOrder(await api.trackOrder(number.trim(), contact.trim()));
      toast.success("Order Found", "Here are your order details.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not look up the order.";
      setError(message);
      toast.error("Tracking Failed", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="grid gap-4 border border-line p-6 md:grid-cols-[1fr_1fr_auto] md:items-end" aria-label="Track your order">
        <TextField label="Order number" required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="GW-261015-ABCDE" maxLength={30} />
        <TextField label="Email or phone" required value={contact} onChange={(e) => setContact(e.target.value)} maxLength={255} />
        <Button type="submit" disabled={busy} aria-busy={busy}>
          {busy ? "Searching…" : "Track"}
        </Button>
      </form>
      <FormAlert tone="error">{error}</FormAlert>
      {order && <OrderSummaryCard order={order} />}
    </div>
  );
}
