"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Image, Badge, PriceDisplay, Icon } from "@/components/atoms";
import { WishlistButton } from "./WishlistButton";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const images = product.images;
  const hasMultiple = images.length > 1;

  const prev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImgIdx((i) => (i === 0 ? images.length - 1 : i - 1));
    },
    [images.length],
  );

  const next = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImgIdx((i) => (i === images.length - 1 ? 0 : i + 1));
    },
    [images.length],
  );

  const onSale = product.discountPercent > 0;
  const soldOut = !product.isAvailable;

  return (
    <article className="group relative flex flex-col">
      {/* Image container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[3/4] overflow-hidden bg-cream"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Image
          src={images[imgIdx] ?? null}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {onSale && !soldOut && (
            <Badge tone="sale">Save {product.discountPercent}%</Badge>
          )}
          {soldOut && <Badge tone="dark">Sold Out</Badge>}
        </div>

        {/* Wishlist button */}
        <div className="absolute right-2 top-2">
          <WishlistButton
            product={product}
            className="bg-white/80 backdrop-blur-sm"
          />
        </div>

        {/* Navigation arrows */}
        {hasMultiple && hovered && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-ink shadow backdrop-blur-sm transition-opacity hover:bg-white"
            >
              <Icon name="chevronLeft" size={16} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-ink shadow backdrop-blur-sm transition-opacity hover:bg-white"
            >
              <Icon name="chevronRight" size={16} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 w-1 rounded-full transition-colors",
                  i === imgIdx ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="mt-2.5 flex flex-col gap-1 px-0.5">
        <PriceDisplay
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
        />
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm leading-snug text-ink hover:underline"
        >
          {product.title}
        </Link>
      </div>
    </article>
  );
}
