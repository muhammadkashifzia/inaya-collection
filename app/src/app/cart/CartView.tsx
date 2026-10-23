"use client";

import { ButtonLink, Container, Heading } from "@/components/atoms";
import { CartLineItem } from "@/components/molecules";
import { useStore } from "@/context/StoreProvider";
import { CartTotals } from "./CartTotals";
import { CouponForm } from "./CouponForm";

export function CartView() {
  const { cart, cartError } = useStore();
  const items = cart?.items ?? [];
  const issueFor = (id: number) => cart?.issues.find((i) => i.itemId === id)?.message;
  const blocking = (cart?.issues.length ?? 0) > 0;

  return (
    <Container className="py-12">
      <Heading level={1} className="mb-8">Your Cart</Heading>
      {cartError && <p role="alert" className="mb-6 bg-error/10 px-4 py-3 text-sm text-error">{cartError}</p>}

      {cart === null ? (
        <p className="py-16 text-center text-muted">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-6 text-muted">Your cart is empty.</p>
          <ButtonLink href="/collections/all" variant="outline">Continue shopping</ButtonLink>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <CartLineItem key={item.id} item={item} issue={issueFor(item.id)} />
            ))}
          </ul>
          <aside className="h-fit space-y-4 bg-cream p-6" aria-label="Order summary">
            <h2 className="font-heading text-xl font-semibold">Order summary</h2>
            <CouponForm />
            <CartTotals cart={cart} shippingNote="Shipping is calculated at checkout." />
            {blocking && <p className="text-xs font-semibold text-error">Please fix the highlighted items before checking out.</p>}
            <ButtonLink href="/checkout" fullWidth size="lg" className={blocking ? "pointer-events-none opacity-50" : undefined}>
              Proceed to checkout
            </ButtonLink>
          </aside>
        </div>
      )}
    </Container>
  );
}
