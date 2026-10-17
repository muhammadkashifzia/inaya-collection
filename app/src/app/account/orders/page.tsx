"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink, FormAlert } from "@/components/atoms";
import { statusLabel } from "@/components/organisms/OrderSummaryCard";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, Paginated } from "@/types";
import { AccountShell } from "../AccountShell";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Order> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.orders(page).then(setResult).catch(() => setError("Could not load your orders."));
  }, [page]);

  return (
    <AccountShell title="My orders">
      <FormAlert tone="error">{error}</FormAlert>
      {!result && !error ? (
        <p className="text-muted">Loading orders…</p>
      ) : result && result.data.length === 0 ? (
        <div className="py-10">
          <p className="mb-6 text-muted">You haven&apos;t placed any orders yet.</p>
          <ButtonLink href="/collections/all" variant="outline">Start shopping</ButtonLink>
        </div>
      ) : result ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Your orders</caption>
              <thead className="border-b border-line text-xs uppercase tracking-widest text-muted">
                <tr><th className="py-3 pr-4">Order</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Items</th><th className="py-3 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.data.map((o) => (
                  <tr key={o.number}>
                    <td className="py-3 pr-4"><Link href={`/account/orders/${o.number}`} className="font-semibold underline">{o.number}</Link></td>
                    <td className="py-3 pr-4">{formatDate(o.placedAt)}</td>
                    <td className="py-3 pr-4">{statusLabel(o.status)}</td>
                    <td className="py-3 pr-4">{o.itemsCount ?? "—"}</td>
                    <td className="py-3 text-right font-semibold">{formatPrice(o.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.meta.lastPage > 1 && (
            <div className="mt-6 flex items-center gap-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border border-line px-4 py-2 disabled:opacity-40">Previous</button>
              <span>Page {result.meta.currentPage} of {result.meta.lastPage}</span>
              <button type="button" disabled={page >= result.meta.lastPage} onClick={() => setPage((p) => p + 1)} className="border border-line px-4 py-2 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      ) : null}
    </AccountShell>
  );
}
