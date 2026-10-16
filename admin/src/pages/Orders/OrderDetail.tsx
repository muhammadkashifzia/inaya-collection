import { useState } from "react";
import { Link, useParams } from "react-router";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import { Notice, TextAreaInput, TextInput } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { date, money, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Address, Order, OrderStatus } from "@/types/api";

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order",
  processing: "Start processing",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
  refunded: "Refund order",
};

function AddressBlock({ title, address }: { title: string; address: Address }) {
  return (
    <div>
      <h3 className="mb-2 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <address className="text-sm leading-relaxed text-gray-700 not-italic dark:text-gray-300">
        {address.full_name}
        <br />
        {address.line1}
        {address.line2 && <>, {address.line2}</>}
        <br />
        {address.city}
        {address.province && `, ${address.province}`} {address.postal_code}
        <br />
        {address.phone}
      </address>
    </div>
  );
}

export default function OrderDetail() {
  const { number = "" } = useParams();
  const { can } = useAuth();
  const { data: order, error, loading, reload, setData } = useApi(() => http.get<Order>(`/admin/orders/${encodeURIComponent(number)}`), [number]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<OrderStatus | "shipment" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<{ carrier: string; tracking_number: string; tracking_url: string } | null>(null);
  const [shipmentError, setShipmentError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const ship = shipment ?? {
    carrier: order?.shipment?.carrier ?? "",
    tracking_number: order?.shipment?.tracking_number ?? "",
    tracking_url: order?.shipment?.tracking_url ?? "",
  };

  async function transition(to: OrderStatus) {
    const destructive = to === "cancelled" || to === "refunded";
    if (destructive && !window.confirm(`${ACTION_LABEL[to]}? Stock will be returned to inventory.`)) return;
    setBusy(to);
    setActionError(null);
    try {
      setData(await http.patch<Order>(`/admin/orders/${encodeURIComponent(number)}/status`, { status: to, note: note || null }));
      setNote("");
      setSaved(`Order marked as ${ORDER_STATUS_LABEL[to].toLowerCase()}.`);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.firstMessage : "Could not update the order.");
    } finally {
      setBusy(null);
    }
  }

  async function saveShipment(e: React.FormEvent) {
    e.preventDefault();
    setBusy("shipment");
    setShipmentError(null);
    try {
      setData(
        await http.put<Order>(`/admin/orders/${encodeURIComponent(number)}/shipment`, {
          carrier: ship.carrier || null,
          tracking_number: ship.tracking_number || null,
          tracking_url: ship.tracking_url || null,
        }),
      );
      setShipment(null);
      setSaved("Shipping details saved.");
    } catch (err) {
      setShipmentError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(null);
    }
  }

  const transitions = (order?.allowed_transitions ?? []).filter((s) => s !== "refunded" || can("refund-orders"));

  return (
    <>
      <PageMeta title={`Order ${number} | Galaxy Wear Admin`} description="Order details." />
      <PageHeader
        title={`Order ${number}`}
        description={order ? `Placed ${date(order.placed_at, true)}` : undefined}
        back={{ to: "/orders", label: "Orders" }}
        actions={
          order && (
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          )
        }
      />
      <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(order)}>
        {order && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-8">
              <Notice tone="success">{saved}</Notice>
              <Card title={`Items (${order.items?.length ?? 0})`} bodyClassName="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</div>
                      <div className="min-w-0 flex-1 text-sm">
                        {item.product_id ? (
                          <Link to={`/products/${item.product_id}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{item.name}</Link>
                        ) : (
                          <span className="font-medium">{item.name}</span>
                        )}
                        <p className="text-theme-xs text-gray-500">
                          {item.sku}
                          {item.variant_name && ` · ${item.variant_name}`}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {money(item.unit_price)}
                      </p>
                      <p className="w-28 text-end text-sm font-semibold">{money(item.line_total)}</p>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-2 border-t border-gray-100 px-5 py-4 text-sm dark:border-gray-800">
                  <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
                  {order.discount_total > 0 && <div className="flex justify-between text-success-600"><dt>Discount {order.coupon_code && `(${order.coupon_code})`}</dt><dd>−{money(order.discount_total)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-gray-500">Shipping ({order.shipping_method})</dt><dd>{order.shipping_total ? money(order.shipping_total) : "Free"}</dd></div>
                  {order.tax_total > 0 && <div className="flex justify-between"><dt className="text-gray-500">Tax</dt><dd>{money(order.tax_total)}</dd></div>}
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold dark:border-gray-800"><dt>Total</dt><dd>{money(order.grand_total)}</dd></div>
                </dl>
              </Card>

              <Card title="Timeline">
                <ol className="relative space-y-5 border-s border-gray-200 ps-6 dark:border-gray-800">
                  {[...(order.status_history ?? [])].reverse().map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -start-7.5 top-1 size-3 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {ORDER_STATUS_LABEL[h.to]}
                        {h.by && <span className="font-normal text-gray-500"> by {h.by}</span>}
                      </p>
                      {h.note && <p className="text-sm text-gray-600 dark:text-gray-400">{h.note}</p>}
                      <p className="text-theme-xs text-gray-400">{date(h.at, true)}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>

            <div className="col-span-12 space-y-6 xl:col-span-4">
              <Card title="Update status">
                {transitions.length === 0 ? (
                  <p className="text-sm text-gray-500">This order is {ORDER_STATUS_LABEL[order.status].toLowerCase()}. No further changes are possible.</p>
                ) : (
                  <div className="space-y-4">
                    <TextAreaInput label="Note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} hint="Saved in the order timeline" />
                    {actionError && <p role="alert" className="text-sm font-medium text-error-600">{actionError}</p>}
                    <div className="grid gap-2">
                      {transitions.map((s) => (
                        <Button key={s} variant={s === "cancelled" || s === "refunded" ? "danger" : "primary"} loading={busy === s} disabled={busy !== null} onClick={() => void transition(s)}>
                          {ACTION_LABEL[s] ?? ORDER_STATUS_LABEL[s]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card title="Customer">
                <p className="font-medium text-gray-800 dark:text-white/90">{order.customer_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <a href={`mailto:${order.email}`} className="hover:text-brand-500">{order.email}</a>
                  <br />
                  <a href={`tel:${order.phone}`} className="hover:text-brand-500">{order.phone}</a>
                </p>
                <p className="mt-2 text-theme-xs text-gray-500">
                  {order.user ? <Link to={`/customers/${order.user.id}`} className="text-brand-500 hover:underline">View customer account</Link> : "Guest checkout"}
                </p>
                {order.customer_note && <p className="mt-3 rounded-lg bg-cream p-3 text-sm text-ink-900 dark:bg-white/5 dark:text-gray-300">“{order.customer_note}”</p>}
                <div className="mt-5 space-y-5 border-t border-gray-100 pt-5 dark:border-gray-800">
                  <AddressBlock title="Delivery address" address={order.shipping_address} />
                  {JSON.stringify(order.billing_address) !== JSON.stringify(order.shipping_address) && <AddressBlock title="Billing address" address={order.billing_address} />}
                </div>
              </Card>

              <Card title="Payment">
                {order.payments?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>
                      {order.payment_method_label}
                      <span className="block text-theme-xs text-gray-500">{p.paid_at ? `Collected ${date(p.paid_at)}` : p.refunded_at ? `Refunded ${date(p.refunded_at)}` : "Collect on delivery"}</span>
                    </span>
                    <span className="text-end">
                      <span className="block font-semibold">{money(p.amount)}</span>
                      <PaymentStatusBadge status={p.status} />
                    </span>
                  </div>
                ))}
              </Card>

              <Card title="Shipping">
                <form onSubmit={saveShipment} className="space-y-4" noValidate>
                  <TextInput label="Courier" value={ship.carrier} onChange={(e) => setShipment({ ...ship, carrier: e.target.value })} placeholder="TCS, Leopards, M&P…" maxLength={60} />
                  <TextInput label="Tracking number" value={ship.tracking_number} onChange={(e) => setShipment({ ...ship, tracking_number: e.target.value })} maxLength={100} />
                  <TextInput label="Tracking link" type="url" value={ship.tracking_url} onChange={(e) => setShipment({ ...ship, tracking_url: e.target.value })} placeholder="https://…" error={shipmentError?.field("tracking_url")} />
                  {order.shipment?.shipped_at && <p className="text-theme-xs text-gray-500">Shipped {date(order.shipment.shipped_at, true)}</p>}
                  {order.shipment?.delivered_at && <p className="text-theme-xs text-gray-500">Delivered {date(order.shipment.delivered_at, true)}</p>}
                  <Button type="submit" variant="dark" size="sm" loading={busy === "shipment"}>Save shipping details</Button>
                </form>
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </>
  );
}
