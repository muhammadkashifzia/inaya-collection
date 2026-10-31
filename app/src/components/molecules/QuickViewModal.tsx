"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppImage, Button, Icon, IconButton, Price, Stars } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { api } from "@/lib/api";
import { cn } from "@/lib/format";
import type { Product, Variant } from "@/types";
import { QuantitySelector } from "./QuantitySelector";
import { WishlistButton } from "./WishlistButton";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

/**
 * Quick view dialog opened from a product card.
 * - Shows the card data straight away, then loads the full product (variants)
 *   and the review summary in the background.
 * - Image slider on the left; title, rating, price, short description,
 *   options, quantity, add to cart, wishlist and buy now on the right.
 * - Rendered in a portal so carousels/overflow on the card can't clip it.
 */
export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const router = useRouter();
  const { addToCart, isCartOpen } = useStore();
  const panel = useRef<HTMLDivElement>(null);
  const cartOpen = useRef(isCartOpen);
  useEffect(() => {
    cartOpen.current = isCartOpen;
  }, [isCartOpen]);
  const [full, setFull] = useState<Product | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);

  // Load variants and review summary.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api
      .product(product.slug, controller.signal)
      .then((p) => {
        if (!active) return;
        setFull(p);
        const initial = p.variants.find((v) => v.inStock) ?? p.variants[0];
        if (initial) setSelected(initial.options);
      })
      .catch((error: Error) => {
        if (active && error.name !== "AbortError") setLoadFailed(true);
      });
    api
      .productReviews(product.slug)
      .then((r) => active && setRating({ average: r.summary.average ?? 0, count: r.summary.count }))
      .catch(() => undefined);
    return () => {
      active = false;
      controller.abort();
    };
  }, [product.slug]);

  // Escape to close, lock page scroll, focus the dialog.
  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      // The cart drawer opens after add-to-cart and keeps its own scroll lock.
      if (!cartOpen.current) document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const source = full ?? product;
  const variants = useMemo(() => full?.variants ?? [], [full]);
  const images = source.images.length ? source.images : [null];
  const count = images.length;
  const current = Math.min(index, count - 1);

  const optionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    variants.forEach((v) =>
      Object.entries(v.options).forEach(([key, value]) => {
        const list = groups.get(key) ?? [];
        if (!list.includes(value)) list.push(value);
        groups.set(key, list);
      }),
    );
    return [...groups.entries()].filter(([, values]) => values.length > 1 || variants.length > 1);
  }, [variants]);

  const variant: Variant | null =
    variants.length === 0
      ? null
      : variants.length === 1
        ? variants[0]
        : (variants.find((v) => Object.entries(selected).every(([k, val]) => v.options[k] === val)) ?? null);

  // Before variants load, single-variant products can still be added via the card's default variant.
  const variantId = variant?.id ?? (variants.length === 0 && product.variantsCount === 1 ? product.defaultVariantId : null);
  const available = product.isAvailable !== false && (variant ? variant.inStock : variantId !== null);
  const loadingOptions = !full && !loadFailed && product.variantsCount > 1;
  const price = variant?.price ?? source.price;
  const compareAt = variant ? variant.compareAtPrice : source.compareAtPrice;
  const description = source.shortDescription ?? source.description;
  const href = `/products/${product.slug}`;

  const isOptionAvailable = (key: string, value: string) =>
    variants.some((v) => v.options[key] === value && v.inStock && Object.entries(selected).every(([k, val]) => k === key || v.options[k] === val));

  const go = (dir: 1 | -1) => setIndex((i) => (Math.min(i, count - 1) + dir + count) % count);

  async function add(mode: "cart" | "buy") {
    if (variantId === null) return;
    setBusy(mode);
    const ok = await addToCart(variantId, qty);
    setBusy(null);
    if (!ok) return;
    onClose();
    if (mode === "buy") router.push("/checkout");
  }

  const cartLabel = loadingOptions
    ? "Loading…"
    : product.isAvailable === false || (variant && !variant.inStock)
      ? "Sold out"
      : variantId === null
        ? "Select options"
        : busy === "cart"
          ? "Adding…"
          : "Add to cart";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
      <button type="button" aria-label="Close quick view" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/50" />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`quick-view-${product.id}`}
        tabIndex={-1}
        className="relative grid max-h-[92vh] w-full max-w-[1000px] overflow-y-auto rounded-xl bg-white shadow-2xl outline-none md:h-[min(88vh,620px)] md:grid-cols-2 md:overflow-hidden"
      >
        {/* Wrapper keeps the button out of the grid flow (IconButton sets `relative`). */}
        <div className="absolute right-2 top-2 z-[5] rounded-full bg-white/90 md:bg-transparent">
          <IconButton icon="close" label="Close quick view" onClick={onClose} className="text-muted hover:text-ink" />
        </div>

        {/* Gallery */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e4db] md:aspect-auto md:h-full">
          <div
            className="flex h-full transition-transform duration-[450ms] ease-out will-change-transform"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {images.map((src, i) => (
              <span key={src ?? i} className="relative block h-full w-full flex-[0_0_100%]" aria-hidden={i !== current}>
                <AppImage
                  src={src}
                  alt={i === 0 ? product.title : ""}
                  fill
                  sizes="(min-width: 768px) 500px, 100vw"
                  className="object-cover [object-position:50%_12%]"
                />
              </span>
            ))}
          </div>
          {count > 1 && (
            <>
              <GalleryButton dir="prev" onClick={() => go(-1)} />
              <GalleryButton dir="next" onClick={() => go(1)} />
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4 p-5 md:overflow-y-auto md:p-8">
          <h2 id={`quick-view-${product.id}`} className="pr-8 font-heading text-2xl font-semibold leading-snug md:text-[28px]">
            {product.title}
          </h2>

          {rating && rating.count > 0 && (
            <p className="-mt-1 flex items-center gap-2 text-sm text-muted">
              <Stars rating={rating.average} className="text-sm" />
              <span>
                ({rating.count} customer {rating.count === 1 ? "review" : "reviews"})
              </span>
            </p>
          )}

          <Price price={price} compareAtPrice={compareAt} size="lg" />

          {description && <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink/70">{description}</p>}

          {variants.length > 1 &&
            optionGroups.map(([key, values]) => (
              <fieldset key={key}>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-widest">
                  {key}: <span className="font-normal normal-case text-muted">{selected[key] ?? "Select"}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const active = selected[key] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelected((s) => ({ ...s, [key]: value }))}
                        className={cn(
                          "min-w-12 border px-3 py-2 text-sm",
                          active ? "border-ink bg-ink text-white" : "border-line hover:border-ink",
                          !isOptionAvailable(key, value) && "text-muted line-through",
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}

          {loadFailed && product.variantsCount > 1 && (
            <p role="alert" className="text-sm text-error">
              Could not load the options. Open the full details to choose a size.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} disabled={!available} />
            <Button
              variant="secondary"
              size="md"
              className="min-w-40 flex-1"
              disabled={!available || variantId === null || busy !== null}
              aria-busy={busy === "cart"}
              onClick={() => void add("cart")}
            >
              <Icon name="bag" size={16} />
              {cartLabel}
            </Button>
            <WishlistButton product={source} className="shrink-0 border border-line" />
          </div>

          <Button
            size="lg"
            fullWidth
            disabled={!available || variantId === null || busy !== null}
            aria-busy={busy === "buy"}
            onClick={() => void add("buy")}
          >
            {busy === "buy" ? "Please wait…" : "Buy it now"}
          </Button>

          <Link
            href={href}
            onClick={onClose}
            className="inline-flex items-center gap-1 self-start text-sm font-semibold text-ink underline-offset-4 hover:text-brand hover:underline"
          >
            View full details
            <Icon name="chevronRight" size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function GalleryButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 z-[3] -mt-[22px] flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#111] shadow-[0_4px_14px_#1111112e] transition-shadow hover:shadow-[0_6px_18px_#1111113d] focus-visible:outline-2 focus-visible:outline-brand",
        dir === "prev" ? "left-4" : "right-4",
      )}
    >
      <Icon name={dir === "prev" ? "chevronLeft" : "chevronRight"} size={18} strokeWidth={1.8} />
    </button>
  );
}
