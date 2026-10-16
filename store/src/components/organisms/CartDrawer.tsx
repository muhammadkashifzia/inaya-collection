"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { Button, ButtonLink, Icon } from "@/components/atoms";
import { CartLineItem } from "@/components/molecules";
import { useStore } from "@/lib/store";

interface CartDrawerProps {
  freeShippingThreshold: number | null;
}

export function CartDrawer({ freeShippingThreshold }: CartDrawerProps) {
  const { cart, cartOpen, closeCart, cartLoading } = useStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  /* Lock body scroll when open */
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  /* Escape key */
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    },
    [closeCart],
  );

  useEffect(() => {
    if (cartOpen) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [cartOpen, onKeyDown]);

  /* Focus trap entry */
  useEffect(() => {
    if (cartOpen) drawerRef.current?.focus();
  }, [cartOpen]);

  const items = cart?.items ?? [];
  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const discountTotal = cart?.discountTotal ?? 0;
  const isEmpty = items.length === 0;
  const issues = cart?.issues ?? [];

  /* Free shipping progress */
  const shippingProgress =
    freeShippingThreshold && freeShippingThreshold > 0
      ? Math.min(100, (subtotal / freeShippingThreshold) * 100)
      : null;
  const remaining =
    freeShippingThreshold && subtotal < freeShippingThreshold
      ? freeShippingThreshold - subtotal
      : 0;

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 transition-opacity"
          onClick={closeCart}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal={cartOpen}
        tabIndex={-1}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300",
          cartOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-heading text-lg font-semibold tracking-wide">
            Your Cart {itemCount > 0 && `(${itemCount})`}
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="p-1 text-ink transition-colors hover:text-brand"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Free shipping progress */}
        {shippingProgress !== null && !isEmpty && (
          <div className="border-b border-line px-5 py-3">
            {remaining > 0 ? (
              <p className="mb-2 text-xs text-muted">
                Add <strong className="text-ink">{formatPrice(remaining)}</strong> more for free shipping
              </p>
            ) : (
              <p className="mb-2 text-xs font-semibold text-green-700">
                You qualify for free shipping!
              </p>
            )}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5">
          {cartLoading && isEmpty ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-brand" />
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Icon name="bag" size={48} className="text-muted" />
              <p className="text-sm text-muted">Your cart is empty</p>
              <ButtonLink href="/collections/all" variant="primary" size="sm" onClick={closeCart}>
                Start Shopping
              </ButtonLink>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {items.map((item) => {
                const issue = issues.find((i) => i.itemId === item.id);
                return (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    onNavigate={closeCart}
                    issue={issue?.message}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-line px-5 py-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>

            {/* Discount */}
            {discountTotal > 0 && (
              <div className="mt-1 flex items-center justify-between text-sm text-green-700">
                <span>Discount {cart?.couponCode && `(${cart.couponCode})`}</span>
                <span>-{formatPrice(discountTotal)}</span>
              </div>
            )}

            <p className="mt-2 text-xs text-muted">
              Shipping calculated at checkout
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <ButtonLink
                href="/checkout"
                variant="primary"
                fullWidth
                onClick={closeCart}
              >
                Checkout
              </ButtonLink>
              <ButtonLink
                href="/cart"
                variant="outline"
                fullWidth
                onClick={closeCart}
              >
                View Cart
              </ButtonLink>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
