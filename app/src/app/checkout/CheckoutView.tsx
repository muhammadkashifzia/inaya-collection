"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppImage, Button, ButtonLink, Container, FormAlert, Heading, TextAreaField, TextField } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import { cn, formatPrice } from "@/lib/format";
import type { Address, Cart, ShippingMethod } from "@/types";
import { CouponForm } from "../cart/CouponForm";
import { CartTotals } from "../cart/CartTotals";

interface CheckoutViewProps {
  shippingMethods: ShippingMethod[];
  paymentMethods: { code: string; name: string }[];
  freeShippingThreshold: number | null;
  allowGuestCheckout: boolean;
}

const emptyAddress = { fullName: "", phone: "", line1: "", line2: "", city: "", province: "", postalCode: "", country: "PK" };
type AddressForm = typeof emptyAddress;

/**
 * Checkout. The browser never sends prices or totals: the summary is fetched
 * from GET /cart?shipping_method=…, and POST /checkout recomputes everything.
 * One Idempotency-Key is kept per attempt, so double-clicks and retries can't
 * create duplicate orders.
 */
export function CheckoutView({ shippingMethods, paymentMethods, freeShippingThreshold, allowGuestCheckout }: CheckoutViewProps) {
  const router = useRouter();
  const toast = useToast();
  const { user, authReady, cart, setCart } = useStore();
  const [summary, setSummary] = useState<Cart | null>(null);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressForm>(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [shippingMethod, setShippingMethod] = useState(shippingMethods[0]?.code ?? "");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.code ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  // Prefill contact details once per signed-in user (state adjustment during render).
  const [prefilledFor, setPrefilledFor] = useState<number | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setContact((c) => ({ name: c.name || user.name, email: c.email || user.email, phone: c.phone || (user.phone ?? "") }));
  }

  // Load saved addresses for signed-in customers.
  useEffect(() => {
    if (!user) return;
    api.addresses()
      .then((list) => {
        setSavedAddresses(list);
        const preferred = list.find((a) => a.isDefaultShipping) ?? list[0];
        if (preferred) setAddressId(preferred.id);
      })
      .catch(() => setSavedAddresses([]));
  }, [user]);

  // Server-side totals for the chosen shipping method.
  useEffect(() => {
    if (!shippingMethod || !cart) return;
    let cancelled = false;
    api.cart(shippingMethod).then((c) => !cancelled && setSummary(c)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [shippingMethod, cart]);

  const display = summary ?? cart;

  if (!authReady || cart === null) {
    return <Container className="py-16 text-center text-muted">Loading checkout…</Container>;
  }
  if (cart.items.length === 0) {
    return (
      <Container className="py-16 text-center">
        <Heading level={1} align="center" className="mb-4">Checkout</Heading>
        <p className="mb-6 text-muted">Your cart is empty.</p>
        <ButtonLink href="/collections/all" variant="outline">Continue shopping</ButtonLink>
      </Container>
    );
  }
  if (!user && !allowGuestCheckout) {
    return (
      <Container className="py-16 text-center">
        <p className="mb-6">Please sign in to complete your order.</p>
        <ButtonLink href="/account/login?next=/checkout">Sign in</ButtonLink>
      </Container>
    );
  }

  const fieldError = (name: string) => error?.field(name);
  const useSaved = user !== null && addressId !== null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    idempotencyKey.current ??= crypto.randomUUID();

    const toInput = (a: AddressForm) => ({ ...a, line2: a.line2 || null, province: a.province || null, postalCode: a.postalCode || null });
    try {
      const order = await api.checkout(
        {
          customerName: contact.name,
          email: contact.email,
          phone: contact.phone,
          shippingAddressId: useSaved ? addressId : null,
          shippingAddress: useSaved ? undefined : toInput(address),
          billingSameAsShipping: billingSame,
          billingAddress: billingSame ? undefined : toInput(billing),
          shippingMethod,
          paymentMethod,
          customerNote: note,
          saveAddress: user !== null && !useSaved && saveAddress,
        },
        idempotencyKey.current,
      );
      sessionStorage.setItem(`gw-order-${order.number}`, JSON.stringify(order));
      setCart({ ...cart!, items: [], itemCount: 0, subtotal: 0, discountTotal: 0, shippingTotal: 0, taxTotal: 0, grandTotal: 0, couponCode: null });
      toast.success("Order Placed", "Your order has been placed successfully!");
      router.replace(`/checkout/success?order=${encodeURIComponent(order.number)}`);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Something went wrong. Please try again.", 0);
      setError(apiError);
      toast.error("Checkout Failed", apiError.status === 422 ? "Please check the highlighted fields." : apiError.message);
      // Validation problems can be fixed and resubmitted with a fresh key.
      if (apiError.status === 422) idempotencyKey.current = null;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  const addressFields = (value: AddressForm, set: (a: AddressForm) => void, prefix: "shipping_address" | "billing_address") => (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Full name" required autoComplete="name" value={value.fullName} onChange={(e) => set({ ...value, fullName: e.target.value })} error={fieldError(`${prefix}.full_name`)} maxLength={120} />
      <TextField label="Phone" required type="tel" autoComplete="tel" value={value.phone} onChange={(e) => set({ ...value, phone: e.target.value })} error={fieldError(`${prefix}.phone`)} maxLength={30} />
      <TextField className="md:col-span-2" label="Address" required autoComplete="address-line1" value={value.line1} onChange={(e) => set({ ...value, line1: e.target.value })} error={fieldError(`${prefix}.line1`)} maxLength={255} />
      <TextField className="md:col-span-2" label="Apartment, area (optional)" autoComplete="address-line2" value={value.line2} onChange={(e) => set({ ...value, line2: e.target.value })} maxLength={255} />
      <TextField label="City" required autoComplete="address-level2" value={value.city} onChange={(e) => set({ ...value, city: e.target.value })} error={fieldError(`${prefix}.city`)} maxLength={100} />
      <TextField label="Province" autoComplete="address-level1" value={value.province} onChange={(e) => set({ ...value, province: e.target.value })} maxLength={100} />
      <TextField label="Postal code" autoComplete="postal-code" value={value.postalCode} onChange={(e) => set({ ...value, postalCode: e.target.value })} maxLength={20} />
    </div>
  );

  const generalError =
    error && (error.field("cart") ?? error.field("coupon_code") ?? error.field("payment_method") ?? error.field("idempotency_key") ?? (Object.keys(error.errors).length ? "Please check the highlighted fields." : error.message));

  return (
    <Container className="py-10 md:py-14">
      <Heading level={1} className="mb-8">Checkout</Heading>
      <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <FormAlert tone="error">{generalError}</FormAlert>

          <section aria-labelledby="contact-heading" className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 id="contact-heading" className="font-heading text-xl font-semibold">Contact</h2>
              {!user && (
                <Link href="/account/login?next=/checkout" className="text-sm underline">Have an account? Sign in</Link>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Full name" required autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} error={fieldError("customer_name")} maxLength={120} />
              <TextField label="Phone" required type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} error={fieldError("phone")} maxLength={30} />
              <TextField className="md:col-span-2" label="Email" required type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={fieldError("email")} maxLength={255} hint="We'll send your order confirmation here." />
            </div>
          </section>

          <section aria-labelledby="delivery-heading" className="space-y-4">
            <h2 id="delivery-heading" className="font-heading text-xl font-semibold">Delivery address</h2>
            {savedAddresses.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="sr-only">Choose a saved address</legend>
                {savedAddresses.map((a) => (
                  <label key={a.id} className={cn("flex cursor-pointer gap-3 border p-3 text-sm", addressId === a.id ? "border-ink" : "border-line")}>
                    <input type="radio" name="saved-address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                    <span>
                      <strong>{a.label ?? a.fullName}</strong> — {a.line1}, {a.city} · {a.phone}
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer gap-3 border p-3 text-sm", addressId === null ? "border-ink" : "border-line")}>
                  <input type="radio" name="saved-address" checked={addressId === null} onChange={() => setAddressId(null)} />
                  Use a new address
                </label>
                {fieldError("shipping_address_id") && <p className="text-xs font-semibold text-brand">{fieldError("shipping_address_id")}</p>}
              </fieldset>
            )}
            {!useSaved && (
              <>
                {addressFields(address, setAddress, "shipping_address")}
                {user && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this address to my account
                  </label>
                )}
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} /> Billing address is the same as delivery
            </label>
            {!billingSame && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-widest">Billing address</h3>
                {addressFields(billing, setBilling, "billing_address")}
              </div>
            )}
          </section>

          <section aria-labelledby="shipping-heading" className="space-y-3">
            <h2 id="shipping-heading" className="font-heading text-xl font-semibold">Shipping method</h2>
            {shippingMethods.map((m) => {
              const free = m.code === "standard" && freeShippingThreshold !== null && display && display.subtotal - display.discountTotal >= freeShippingThreshold;
              return (
                <label key={m.code} className={cn("flex cursor-pointer items-center justify-between gap-3 border p-4 text-sm", shippingMethod === m.code ? "border-ink" : "border-line")}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="shipping" value={m.code} checked={shippingMethod === m.code} onChange={() => setShippingMethod(m.code)} />
                    {m.name}
                  </span>
                  <span className="font-semibold">{free || m.fee === 0 ? "Free" : formatPrice(m.fee)}</span>
                </label>
              );
            })}
            {fieldError("shipping_method") && <p className="text-xs font-semibold text-brand">{fieldError("shipping_method")}</p>}
          </section>

          <section aria-labelledby="payment-heading" className="space-y-3">
            <h2 id="payment-heading" className="font-heading text-xl font-semibold">Payment</h2>
            {paymentMethods.length === 0 && <FormAlert tone="error">No payment methods are available right now.</FormAlert>}
            {paymentMethods.map((p) => (
              <label key={p.code} className={cn("flex cursor-pointer items-center gap-3 border p-4 text-sm", paymentMethod === p.code ? "border-ink" : "border-line")}>
                <input type="radio" name="payment" value={p.code} checked={paymentMethod === p.code} onChange={() => setPaymentMethod(p.code)} />
                <span>
                  <strong>{p.name}</strong>
                  {p.code === "cod" && <span className="block text-xs text-muted">Pay in cash when your order is delivered.</span>}
                </span>
              </label>
            ))}
            <TextAreaField label="Order note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </section>
        </div>

        <aside className="h-fit space-y-5 bg-cream p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="font-heading text-xl font-semibold">Order summary</h2>
          <ul className="space-y-3">
            {(display?.items ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-white">
                  <AppImage src={item.image} alt="" fill sizes="48px" className="object-cover" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-white">
                    {item.quantity}
                  </span>
                </div>
                <span className="flex-1">
                  {item.name}
                  {item.variantName && <span className="block text-xs text-muted">{item.variantName}</span>}
                </span>
                <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          {(display?.issues.length ?? 0) > 0 && (
            <ul className="space-y-1 text-xs font-semibold text-brand" role="alert">
              {display!.issues.map((i) => <li key={i.itemId}>{i.message}</li>)}
            </ul>
          )}
          <CouponForm />
          {display && <CartTotals cart={display} />}
          <Button type="submit" size="lg" fullWidth disabled={busy || paymentMethods.length === 0} aria-busy={busy}>
            {busy ? "Placing order…" : `Place order${display ? ` · ${formatPrice(display.grandTotal)}` : ""}`}
          </Button>
          <p className="text-xs text-muted">Prices and totals are confirmed by our system when you place the order.</p>
        </aside>
      </form>
    </Container>
  );
}
