"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppImage, Badge, Button, Icon, Price } from "@/components/atoms";
import { AddToCartButton, QuantitySelector, WishlistButton } from "@/components/molecules";
import { useStore } from "@/context/StoreProvider";
import { cn } from "@/lib/format";
import type { Product, Variant } from "@/types";

interface ProductDetailProps {
  product: Product;
  maxQuantity: number;
}

/**
 * Gallery + purchase panel. Variant option groups (e.g. colour, size) are
 * derived from each variant's `options`; price and availability follow the
 * selected variant. Stock is re-validated by the API on add-to-cart.
 */
export function ProductDetail({ product, maxQuantity }: ProductDetailProps) {
  const router = useRouter();
  const { addToCart } = useStore();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  const variants = product.variants;
  const initial = variants.find((v) => v.inStock) ?? variants[0] ?? null;
  const [selected, setSelected] = useState<Record<string, string>>(initial?.options ?? {});

  const optionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    variants.forEach((v) =>
      Object.entries(v.options).forEach(([key, value]) => {
        const list = groups.get(key) ?? [];
        if (!list.includes(value)) list.push(value);
        groups.set(key, list);
      }),
    );
    // Only show groups that actually let the customer choose.
    return [...groups.entries()].filter(([, values]) => values.length > 1 || variants.length > 1);
  }, [variants]);

  const variant: Variant | null =
    variants.length <= 1
      ? (variants[0] ?? null)
      : (variants.find((v) => Object.entries(selected).every(([k, val]) => v.options[k] === val)) ?? null);

  const price = variant?.price ?? product.price;
  const compareAt = variant ? variant.compareAtPrice : product.compareAtPrice;
  const available = Boolean(variant?.inStock) && product.isAvailable !== false;
  const off = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const images = product.images.length ? product.images : [null];

  const isOptionAvailable = (key: string, value: string) =>
    variants.some((v) => v.options[key] === value && v.inStock && Object.entries(selected).every(([k, val]) => k === key || v.options[k] === val));

  async function buyNow() {
    if (!variant) return;
    setBuying(true);
    const ok = await addToCart(variant.id, qty);
    setBuying(false);
    if (ok) router.push("/checkout");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-14">
      <div className="flex flex-col-reverse gap-2.5 sm:gap-3 md:flex-row">
        <ul className="no-scrollbar flex gap-2 overflow-x-auto sm:gap-3 md:flex-col md:overflow-x-visible" aria-label="Product images">
          {images.map((src, i) => (
            <li key={src ?? i}>
              <button
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === activeImage}
                className={cn("relative block h-16 w-14 shrink-0 overflow-hidden border-2 sm:h-20 sm:w-16 md:h-24 md:w-20", i === activeImage ? "border-ink" : "border-transparent")}
              >
                <AppImage src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
        <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-[#e8e4db]">
          <AppImage
            src={images[activeImage]}
            alt={`${product.title}, image ${activeImage + 1}`}
            fill
            preload
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover [object-position:50%_12%]"
          />
          {off > 0 && <Badge className="absolute left-3 top-3">Save {off}%</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        {product.categoryName && <p className="text-[11px] font-semibold uppercase tracking-widest text-muted sm:text-xs">{product.categoryName}</p>}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <h1 className="font-heading text-xl font-semibold leading-snug sm:text-2xl md:text-3xl">{product.title}</h1>
          <WishlistButton product={product} className="shrink-0 border border-line" />
        </div>
        <Price price={price} compareAtPrice={compareAt} size="lg" />
        <p className="text-[11px] text-muted sm:text-xs">Tax included. Shipping calculated at checkout.</p>

        <dl className="grid grid-cols-3 gap-2 border-y border-line py-3 text-[13px] sm:gap-3 sm:py-4 sm:text-sm">
          <div>
            <dt className="text-[10px] uppercase text-muted sm:text-xs">Fabric</dt>
            <dd className="font-semibold">{product.fabric ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-muted sm:text-xs">Pieces</dt>
            <dd className="font-semibold">{product.pieces ? `${product.pieces} Piece` : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-muted sm:text-xs">SKU</dt>
            <dd className="truncate font-semibold">{variant?.sku ?? product.sku}</dd>
          </div>
        </dl>

        {variants.length > 1 &&
          optionGroups.map(([key, values]) => (
            <fieldset key={key}>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-widest">
                {key}: <span className="font-normal normal-case text-muted">{selected[key] ?? "Select"}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const active = selected[key] === value;
                  const possible = isOptionAvailable(key, value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelected((s) => ({ ...s, [key]: value }))}
                      className={cn(
                        "min-w-12 border px-3 py-2 text-sm",
                        active ? "border-ink bg-ink text-white" : "border-line hover:border-ink",
                        !possible && "text-muted line-through",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <QuantitySelector value={qty} onChange={setQty} max={maxQuantity} disabled={!available} />
          <p className={cn("flex items-center gap-1 text-[13px] font-semibold sm:text-sm", available ? "text-emerald-700" : "text-error")} aria-live="polite">
            <Icon name={available ? "check" : "close"} size={16} />
            {!variant ? "Select options" : available ? (variant.lowStock ? "Only a few left" : "In stock") : "Sold out"}
          </p>
        </div>

        <div className="grid gap-2.5 sm:gap-3">
          <AddToCartButton variantId={variant?.id ?? null} available={available} quantity={qty} size="lg" />
          <Button size="lg" disabled={!available || buying} onClick={buyNow} fullWidth aria-busy={buying}>
            {buying ? "Please wait…" : "Buy it now"}
          </Button>
        </div>

        {product.description && (
          <div>
            <h2 className="mb-1.5 text-[13px] font-semibold uppercase tracking-widest sm:mb-2 sm:text-sm">Description</h2>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink/80 sm:text-sm">{product.description}</p>
          </div>
        )}
        {product.details.length > 0 && (
          <div>
            <h2 className="mb-1.5 text-[13px] font-semibold uppercase tracking-widest sm:mb-2 sm:text-sm">What&apos;s included</h2>
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-ink/80 sm:text-sm">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
