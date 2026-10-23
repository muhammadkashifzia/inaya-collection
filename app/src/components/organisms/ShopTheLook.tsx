"use client";

import Link from "next/link";
import { useState } from "react";
import { AppImage, Container, Icon } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import { WishlistButton } from "@/components/molecules/WishlistButton";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

interface Look {
  image: string;
  products: Product[];
}

interface ShopTheLookProps {
  title: string;
  looks: Look[];
}

/**
 * "Shop the Look" — lifestyle image left, product detail right.
 * Arrows cycle looks; dots cycle products within a look.
 * Right-side product image swaps to the second image on hover.
 */
export function ShopTheLook({ title, looks }: ShopTheLookProps) {
  const validLooks = looks.filter((l) => l.image && l.products.length > 0);
  const [lookIdx, setLookIdx] = useState(0);
  const [prodIdx, setProdIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  if (validLooks.length === 0) return null;

  const look = validLooks[lookIdx % validLooks.length];
  const product = look.products[prodIdx % look.products.length];
  const href = `/products/${product.slug}`;
  const secondImage = product.images.length > 1 ? product.images[1] : null;
  const displayImage = hovered && secondImage ? secondImage : product.images[0];

  function goLook(dir: -1 | 1) {
    setLookIdx((i) => (i + dir + validLooks.length) % validLooks.length);
    setProdIdx(0);
    setHovered(false);
  }

  return (
    <section className="py-10 md:py-14">
      <Container>
        <SectionHeader title={title} />

        <div className="relative">
          {/* Prev / Next look arrows */}
          {validLooks.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goLook(-1)}
                aria-label="Previous look"
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-cream md:-left-4"
              >
                <Icon name="chevronLeft" size={20} />
              </button>
              <button
                type="button"
                onClick={() => goLook(1)}
                aria-label="Next look"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-cream md:-right-4"
              >
                <Icon name="chevronRight" size={20} />
              </button>
            </>
          )}

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12 lg:gap-16">
            {/* Left — lifestyle image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-cream">
              <AppImage
                src={look.image}
                alt={`${title} look ${lookIdx + 1}`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Right — product detail card */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="w-full max-w-[280px]"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                {/* Product image with hover swap + wishlist */}
                <div className="relative mb-5">
                  <Link
                    href={href}
                    className="relative block aspect-[3/4] overflow-hidden bg-cream"
                  >
                    <AppImage
                      src={displayImage}
                      alt={product.title}
                      fill
                      sizes="280px"
                      className="object-cover transition-opacity duration-300"
                    />
                  </Link>
                  <div className="absolute right-2 top-2">
                    <WishlistButton product={product} />
                  </div>
                </div>

                {/* Product info */}
                <div className="text-center">
                  {product.categoryName && (
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                      {product.categoryName}
                    </p>
                  )}
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink">
                    <Link href={href} className="hover:underline">{product.title}</Link>
                  </h3>
                  <p className="mb-4 text-sm font-semibold text-ink">
                    {formatPrice(product.price)}
                  </p>
                  <Link
                    href={href}
                    className="inline-block border border-ink px-8 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:bg-ink hover:text-white"
                  >
                    View Product
                  </Link>
                </div>
              </div>

              {/* Dot indicators */}
              {look.products.length > 1 && (
                <div className="mt-6 flex gap-2.5" role="tablist" aria-label="Products in this look">
                  {look.products.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={i === prodIdx % look.products.length}
                      aria-label={p.title}
                      onClick={() => { setProdIdx(i); setHovered(false); }}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === prodIdx % look.products.length ? "bg-ink" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
