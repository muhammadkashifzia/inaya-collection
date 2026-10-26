"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type PointerEvent } from "react";
import { AppImage, Icon } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { cn, formatPrice } from "@/lib/format";
import type { Product } from "@/types";
import { WishlistButton } from "./WishlistButton";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

/**
 * Product card
 * - 3:4 image slider with prev/next arrows (desktop hover only); hovering
 *   slides to the second image, leaving slides back to the first
 * - Wishlist heart top-left, "Sale" pill top-right
 * - Desktop: full-width black "Add to cart" bar slides up on hover
 * - Mobile: round black cart-plus button, always visible bottom-right
 *
 * Single-variant products are added straight to the cart; products with
 * several variants (size/colour) open the product page to choose options.
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useStore();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const images = product.images.length ? product.images : [null];
  const count = images.length;
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const href = `/products/${product.slug}`;
  const available = product.isAvailable;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  /** Mouse hover slides the first image away to reveal the second; leaving resets it. */
  function onPointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && count > 1) {
      setIndex((i) => (i === 0 ? 1 : i));
    }
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      setIndex(0);
    }
  }

  async function onAdd() {
    if (product.variantsCount !== 1 || product.defaultVariantId === null) {
      router.push(href);
      return;
    }
    setBusy(true);
    await addToCart(product.defaultVariantId, 1);
    setBusy(false);
  }

  return (
    <div className="group/card relative h-full">
      <WishlistButton product={product} className="absolute left-2 top-2 z-[4]" />

      <div className="flex h-full flex-col">
        <div
          className="relative aspect-[3/4] overflow-hidden bg-[#e8e4db]"
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          <Link href={href} aria-label={product.title} className="block h-full">
            <div
              className="flex h-full transition-transform duration-[450ms] ease-out will-change-transform"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {images.map((src, i) => (
                <span key={src ?? i} className="relative block h-full w-full flex-[0_0_100%]" aria-hidden={i !== index}>
                  <AppImage
                    src={src}
                    alt={i === 0 ? product.title : ""}
                    fill
                    preload={priority && i === 0}
                    sizes="(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw"
                    className="object-cover [object-position:50%_12%]"
                  />
                </span>
              ))}
            </div>
          </Link>

          {onSale && (
            <span className="pointer-events-none absolute right-2 top-2 z-[4] inline-flex min-h-[22px] items-center justify-center rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
              Sale
            </span>
          )}
          {!available && (
            <span className="pointer-events-none absolute bottom-2 left-2 z-[4] rounded-full bg-[#111] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
              Sold out
            </span>
          )}

          {count > 1 && (
            <>
              <SlideButton dir="prev" onClick={() => go(-1)} />
              <SlideButton dir="next" onClick={() => go(1)} />
            </>
          )}

          <div className="absolute bottom-2 right-2 z-[3] md:inset-x-2.5 md:bottom-2.5">
            <button
              type="button"
              disabled={!available || busy}
              onClick={onAdd}
              aria-busy={busy}
              aria-label={available ? `Add ${product.title} to cart` : `${product.title} is sold out`}
              className={cn(
                "inline-flex items-center justify-center bg-[#111] font-bold uppercase text-white transition-[opacity,transform,background-color] duration-200 hover:bg-[#d70500] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-[#111]/60",
                "h-9 w-9 rounded-full",
                "md:h-auto md:min-h-[42px] md:w-full md:translate-y-2 md:rounded md:text-[13px] md:tracking-[0.06em] md:opacity-0",
                "md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 md:group-focus-within/card:translate-y-0 md:group-focus-within/card:opacity-100",
              )}
            >
              <Icon name="bagPlus" size={18} strokeWidth={1.5} className="md:hidden" />
              <span className="hidden md:inline">
                {!available ? "Sold out" : busy ? "Adding…" : product.variantsCount > 1 ? "Choose options" : "Add to cart"}
              </span>
            </button>
          </div>
        </div>

        <Link href={href} className="block text-inherit">
          <span className="block pb-0.5 pt-2.5 text-[13px] leading-[1.4] font-semibold text-[#1a1a1a] group-hover/card:text-brand sm:pt-3 sm:text-[15px]">
            {product.title}
          </span>
          <span className="flex items-baseline gap-[0.35rem] text-[0.82rem] font-bold text-[#111] sm:gap-[0.45rem] sm:text-[0.9rem]">
            {onSale && (
              <s className="font-medium text-[#888]">
                <span className="sr-only">Regular price </span>
                {formatPrice(product.compareAtPrice!)}
              </s>
            )}
            <span className="sr-only">{onSale ? "Sale price " : "Price "}</span>
            {formatPrice(product.price)}
          </span>
        </Link>
      </div>
    </div>
  );
}

function SlideButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 z-[3] -mt-[18px] hidden h-9 w-9 items-center justify-center rounded-lg bg-white text-[#111] opacity-0 shadow-[0_4px_14px_#1111112e] transition-[opacity,box-shadow] duration-200 hover:shadow-[0_6px_18px_#1111113d] md:flex",
        "group-hover/card:opacity-100 group-focus-within/card:opacity-100",
        dir === "prev" ? "left-2.5" : "right-2.5",
      )}
    >
      <Icon name={dir === "prev" ? "chevronLeft" : "chevronRight"} size={16} strokeWidth={1.8} />
    </button>
  );
}
