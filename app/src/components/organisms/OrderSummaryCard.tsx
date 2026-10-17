import { AppImage } from "@/components/atoms";
import { cn, formatDate, formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status] ?? status;
}

/** Order details: progress tracker, items, totals, address and shipment info. */
export function OrderSummaryCard({ order }: { order: Order }) {
  const stepIndex = STEPS.indexOf(order.status);
  const closed = order.status === "cancelled" || order.status === "refunded";
  const address = order.shippingAddress;

  return (
    <article className="space-y-8 border border-line p-6" aria-label={`Order ${order.number}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Order {order.number}</h2>
          <p className="text-sm text-muted">Placed on {formatDate(order.placedAt)}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", closed ? "bg-brand/10 text-brand" : "bg-emerald-50 text-emerald-800")}>
          {statusLabel(order.status)}
        </span>
      </header>

      {!closed && (
        <ol className="grid grid-cols-5 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider" aria-label="Order progress">
          {STEPS.map((step, i) => (
            <li key={step} aria-current={i === stepIndex ? "step" : undefined} className="flex flex-col items-center gap-2">
              <span className={cn("h-1.5 w-full", i <= stepIndex ? "bg-brand" : "bg-cream")} aria-hidden="true" />
              <span className={i <= stepIndex ? "text-ink" : "text-muted"}>{statusLabel(step)}</span>
            </li>
          ))}
        </ol>
      )}

      {order.shipment?.trackingNumber && (
        <p className="bg-cream p-3 text-sm">
          {order.shipment.carrier ?? "Courier"} tracking: <strong>{order.shipment.trackingNumber}</strong>
          {order.shipment.trackingUrl && (
            <>
              {" · "}
              <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                Track shipment
              </a>
            </>
          )}
        </p>
      )}

      {order.items.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                <AppImage src={item.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{item.name}</p>
                {item.variantName && <p className="text-xs text-muted">{item.variantName}</p>}
                <p className="text-xs text-muted">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="text-sm">
          <h3 className="mb-2 font-semibold uppercase tracking-widest">Delivery address</h3>
          <address className="not-italic text-ink/80">
            {address.full_name}
            <br />
            {address.line1}
            {address.line2 && <>, {address.line2}</>}
            <br />
            {address.city}
            {address.province && `, ${address.province}`}
            <br />
            {address.phone}
          </address>
          <p className="mt-3 text-ink/80">Payment: {order.paymentMethodLabel}</p>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700"><dt>Discount{order.couponCode && ` (${order.couponCode})`}</dt><dd>−{formatPrice(order.discountTotal)}</dd></div>
          )}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingTotal ? formatPrice(order.shippingTotal) : "Free"}</dd></div>
          {order.taxTotal > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{formatPrice(order.taxTotal)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.grandTotal)}</dd></div>
        </dl>
      </div>
    </article>
  );
}
