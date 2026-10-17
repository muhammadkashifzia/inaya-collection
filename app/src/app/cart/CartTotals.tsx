import { formatPrice } from "@/lib/format";
import type { Cart } from "@/types";

/** Totals exactly as computed by the API. */
export function CartTotals({ cart, shippingNote }: { cart: Cart; shippingNote?: string }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
      {cart.discountTotal > 0 && (
        <div className="flex justify-between text-emerald-700">
          <dt>Discount ({cart.couponCode})</dt>
          <dd>−{formatPrice(cart.discountTotal)}</dd>
        </div>
      )}
      {shippingNote ? (
        <div className="flex justify-between text-muted"><dt>Shipping</dt><dd>{shippingNote}</dd></div>
      ) : (
        <div className="flex justify-between"><dt>Shipping</dt><dd>{cart.shippingTotal ? formatPrice(cart.shippingTotal) : "Free"}</dd></div>
      )}
      {cart.taxTotal > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{formatPrice(cart.taxTotal)}</dd></div>}
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd>{formatPrice(shippingNote ? cart.subtotal - cart.discountTotal + cart.taxTotal : cart.grandTotal)}</dd>
      </div>
    </dl>
  );
}
