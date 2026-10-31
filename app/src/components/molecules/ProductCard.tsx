"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type PointerEvent } from "react";
import { AppImage, Icon } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { cn, formatPrice } from "@/lib/format";
import type { Product } from "@/types";
import { QuickViewModal } from "./QuickViewModal";
import { WishlistButton } from "./WishlistButton";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

/**
 * Product card
 * - 3:4 image slider with prev/next arrows (desktop hover only); hovering
 *   slides to the second image, leaving slides back to the first
 * - Wishlist heart top-right, "Sale" pill top-left
 * - Quick view eye button under the heart, shown on hover only, opens a modal
 * - Desktop: full-width black "Add to cart" bar slides up on hover
 * - Mobile: round black cart-plus button, always visible bottom-right
 *
 * Single-variant products are added straight to the cart; products with
 * several variants (size/colour) open the product page to choose options.
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart, isWishlisted } = useStore();
  const saved = isWishlisted(product.id);
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [quickView, setQuickView] = useState(false);
  const eyeButton = useRef<HTMLButtonElement>(null);
  const closeQuickView = useCallback(() => {
    setQuickView(false);
    eyeButton.current?.focus();
  }, []);
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
    <div className="group/card relative h-full" data-sp-title={product.title} data-sp-image={product.images[0] ?? undefined}>
      {/* Action column, top-right: heart always visible, quick view (eye) below it on hover. */}
      <div className="absolute right-2.5 top-2.5 z-[4] flex flex-col gap-2">
        <span className="group/action relative flex">
          <WishlistButton product={product} className="hover:bg-[#111] hover:text-white" />
          <ActionTooltip label={saved ? "Remove From Wishlist" : "Add To Wishlist"} />
        </span>
        <span
          className={cn(
            "group/action relative flex transition-[opacity,transform] duration-300",
            "pointer-events-none translate-x-2 opacity-0",
            "group-hover/card:pointer-events-auto group-hover/card:translate-x-0 group-hover/card:opacity-100",
            "group-focus-within/card:pointer-events-auto group-focus-within/card:translate-x-0 group-focus-within/card:opacity-100",
          )}
        >
          <button
            ref={eyeButton}
            type="button"
            onClick={() => setQuickView(true)}
            aria-label={`Quick view ${product.title}`}
            aria-haspopup="dialog"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[#222] shadow-[0_2px_8px_#0000001f] transition-colors duration-200 hover:bg-[#111] hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="eye" size={20} strokeWidth={1.6} />
          </button>
          <ActionTooltip label="Quick View" />
        </span>
      </div>
      {quickView && <QuickViewModal product={product} onClose={closeQuickView} />}

      <div className="flex h-full flex-col">
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-[#e8e4db]"
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
            <span className="pointer-events-none absolute left-2 top-2 z-[4] inline-flex min-h-[22px] items-center justify-center rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
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
          <span className="block pb-0.5 pt-3 text-[15px] font-semibold leading-[1.4] text-[#1a1a1a] group-hover/card:text-brand">
            {product.title}
          </span>
          <span className="flex items-baseline gap-[0.45rem] text-[0.9rem] font-bold text-[#111]">
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

/**
 * Dark label that slides in to the left of a card action button on hover
 * (or keyboard focus). Desktop only; the button keeps its own aria-label.
 */
function ActionTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded bg-[#111] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 transition-[opacity,transform] duration-200 md:block",
        "after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-transparent after:border-l-[#111] after:content-['']",
        "group-hover/action:translate-x-0 group-hover/action:opacity-100 group-has-[:focus-visible]/action:translate-x-0 group-has-[:focus-visible]/action:opacity-100",
      )}
    >
      {label}
    </span>
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
