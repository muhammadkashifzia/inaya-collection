"use client";

import { useEffect, useRef } from "react";
import { Button, ButtonLink, IconButton } from "@/components/atoms";
import { CartLineItem } from "@/components/molecules";
import { useStore } from "@/context/StoreProvider";
import { cn, formatPrice } from "@/lib/format";

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number | null }) {
  const { cart, cartError, isCartOpen, closeCart } = useStore();
  const panel = useRef<HTMLDivElement>(null);
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discounted = subtotal - (cart?.discountTotal ?? 0);
  const remaining = freeShippingThreshold ? Math.max(0, freeShippingThreshold - discounted) : 0;
  const progress = freeShippingThreshold ? Math.min(100, (discounted / freeShippingThreshold) * 100) : 100;

  useEffect(() => {
    if (!isCartOpen) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isCartOpen, closeCart]);

  const issueFor = (id: number) => cart?.issues.find((i) => i.itemId === id)?.message;

  return (
    <div className={cn("fixed inset-0 z-50", isCartOpen ? "visible" : "invisible")} aria-hidden={!isCartOpen}>
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={-1}
        onClick={closeCart}
        className={cn("absolute inset-0 bg-black/50 transition-opacity", isCartOpen ? "opacity-100" : "opacity-0")}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white outline-none transition-transform",
          isCartOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-heading text-xl font-semibold">Your Cart</h2>
          <IconButton icon="close" label="Close cart" onClick={closeCart} />
        </div>

        {freeShippingThreshold !== null && items.length > 0 && (
          <div className="border-b border-line px-5 py-3 text-xs">
            <p>
              {remaining > 0 ? (
                <>Add <strong>{formatPrice(remaining)}</strong> more for free shipping</>
              ) : (
                <strong>You&apos;ve unlocked free shipping</strong>
              )}
            </p>
            <div className="mt-2 h-1.5 bg-cream" aria-hidden="true">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {cartError && (
          <p role="alert" className="mx-5 mt-3 bg-error/10 px-3 py-2 text-xs font-semibold text-error">
            {cartError}
          </p>
        )}

        {cart === null && !cartError ? (
          <p className="flex-1 px-5 py-10 text-center text-sm text-muted">Loading your cart…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <Button variant="outline" onClick={closeCart}>
              Continue shopping
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} onNavigate={closeCart} issue={issueFor(item.id)} />
              ))}
            </ul>
            <div className="space-y-3 border-t border-line px-5 py-5">
              <div className="flex justify-between text-sm font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {(cart?.discountTotal ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Discount ({cart?.couponCode})</span>
                  <span>−{formatPrice(cart!.discountTotal)}</span>
                </div>
              )}
              <p className="text-xs text-muted">Shipping is calculated at checkout.</p>
              <div className="grid gap-2" onClick={closeCart}>
                <ButtonLink href="/checkout" fullWidth size="lg">
                  Checkout
                </ButtonLink>
                <ButtonLink href="/cart" fullWidth size="md" variant="outline">
                  View cart
                </ButtonLink>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
