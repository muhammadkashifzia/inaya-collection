"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, formatPrice } from "@/lib/utils";
import { Image, Badge, Icon, Button, PriceDisplay, Heading } from "@/components/atoms";
import { AddToCartButton, QuantitySelector } from "@/components/molecules";
import { useStore } from "@/lib/store";
import type { Product, Variant } from "@/lib/types";

interface ProductDetailProps {
  product: Product;
  maxQuantity: number;
}

export function ProductDetail({ product, maxQuantity }: ProductDetailProps) {
  const router = useRouter();
  const { addToCart } = useStore();

  /* ── State ── */
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buyingNow, setBuyingNow] = useState(false);

  /* ── Variant selection ── */
  const optionNames = useMemo(() => {
    const names = new Set<string>();
    product.variants.forEach((v) =>
      Object.keys(v.options).forEach((k) => names.add(k)),
    );
    return Array.from(names);
  }, [product.variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaultVariant = product.variants.find(
      (v) => v.id === product.defaultVariantId,
    );
    return defaultVariant?.options ?? product.variants[0]?.options ?? {};
  });

  const selectedVariant = useMemo<Variant | null>(() => {
    return (
      product.variants.find((v) =>
        Object.entries(selectedOptions).every(
          ([k, val]) => v.options[k] === val,
        ),
      ) ?? null
    );
  }, [product.variants, selectedOptions]);

  const optionValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const name of optionNames) {
      const values = new Set<string>();
      product.variants.forEach((v) => {
        if (v.options[name]) values.add(v.options[name]);
      });
      map[name] = Array.from(values);
    }
    return map;
  }, [product.variants, optionNames]);

  const handleOption = useCallback(
    (name: string, value: string) => {
      setSelectedOptions((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  /* ── Buy now ── */
  const handleBuyNow = async () => {
    if (!selectedVariant) return;
    setBuyingNow(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      router.push("/checkout");
    } finally {
      setBuyingNow(false);
    }
  };

  const displayPrice = selectedVariant?.price ?? product.price;
  const displayCompare =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const isAvailable = selectedVariant ? selectedVariant.inStock : product.isAvailable;
  const onSale = product.discountPercent > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* ── Left: Image gallery ── */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-y-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  "relative h-16 w-12 shrink-0 overflow-hidden border-2 transition-colors sm:h-20 sm:w-16",
                  i === selectedImage ? "border-brand" : "border-transparent hover:border-ink/20",
                )}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
          <Image
            src={product.images[selectedImage] ?? null}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          {onSale && isAvailable && (
            <Badge tone="sale" className="absolute left-3 top-3">
              Save {product.discountPercent}%
            </Badge>
          )}
          {!isAvailable && (
            <Badge tone="dark" className="absolute left-3 top-3">
              Sold Out
            </Badge>
          )}

          {/* Prev / Next */}
          {product.images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setSelectedImage((i) =>
                    i === 0 ? product.images.length - 1 : i - 1,
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm hover:bg-white"
              >
                <Icon name="chevronLeft" size={18} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() =>
                  setSelectedImage((i) =>
                    i === product.images.length - 1 ? 0 : i + 1,
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm hover:bg-white"
              >
                <Icon name="chevronRight" size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Right: Info ── */}
      <div className="flex flex-col gap-5">
        {/* Breadcrumb-style meta */}
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {product.categoryName && (
            <span>{product.categoryName}</span>
          )}
          {product.sku && (
            <>
              <span aria-hidden>·</span>
              <span>SKU: {product.sku}</span>
            </>
          )}
          {product.fabric && (
            <>
              <span aria-hidden>·</span>
              <span>{product.fabric}</span>
            </>
          )}
          {product.pieces != null && (
            <>
              <span aria-hidden>·</span>
              <span>{product.pieces} Piece{product.pieces !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>

        <Heading level={1}>{product.title}</Heading>

        <PriceDisplay
          price={displayPrice}
          compareAtPrice={displayCompare}
          size="lg"
        />

        {/* Variant selector */}
        {optionNames.length > 0 && (
          <div className="flex flex-col gap-4">
            {optionNames.map((name) => (
              <fieldset key={name}>
                <legend className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                  {name}: <span className="font-normal text-ink">{selectedOptions[name]}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {optionValues[name].map((value) => {
                    const isActive = selectedOptions[name] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleOption(name, value)}
                        className={cn(
                          "min-w-[3rem] border px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
                          isActive
                            ? "border-ink bg-ink text-white"
                            : "border-ink/20 text-ink hover:border-ink",
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {/* Low stock */}
        {selectedVariant?.lowStock && isAvailable && (
          <p className="text-xs font-semibold text-brand">Low stock — order soon</p>
        )}

        {/* Quantity + Add to Cart */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={maxQuantity}
              label="Product quantity"
            />
          </div>

          <AddToCartButton
            variantId={selectedVariant?.id ?? null}
            available={isAvailable}
            quantity={quantity}
            size="lg"
          />

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={!isAvailable || !selectedVariant || buyingNow}
            onClick={handleBuyNow}
            aria-busy={buyingNow}
          >
            {buyingNow ? "Processing…" : "Buy It Now"}
          </Button>
        </div>

        {/* Description */}
        {product.shortDescription && (
          <p className="text-sm leading-relaxed text-ink/80">
            {product.shortDescription}
          </p>
        )}

        {product.description && (
          <div
            className="prose prose-sm max-w-none text-ink/80"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {/* Details list */}
        {product.details.length > 0 && (
          <div className="border-t border-line pt-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
              Details
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-ink/80">
              {product.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
