"use client";

import { useState } from "react";
import { AppImage, Container, Icon } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import { ProductCard } from "@/components/molecules/ProductCard";
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
 * "Shop the Look" section — a lifestyle image on the left with a product
 * carousel on the right. Arrows navigate between looks; dots cycle products
 * within the active look.
 */
export function ShopTheLook({ title, looks }: ShopTheLookProps) {
  const validLooks = looks.filter((l) => l.image && l.products.length > 0);
  const [lookIndex, setLookIndex] = useState(0);
  const [productIndex, setProductIndex] = useState(0);

  if (validLooks.length === 0) return null;

  const look = validLooks[lookIndex % validLooks.length];
  const product = look.products[productIndex % look.products.length];

  function goLook(dir: -1 | 1) {
    const next = (lookIndex + dir + validLooks.length) % validLooks.length;
    setLookIndex(next);
    setProductIndex(0);
  }

  function goProduct(idx: number) {
    setProductIndex(idx);
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
                className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition-colors hover:bg-cream md:left-2 md:translate-x-0"
              >
                <Icon name="chevronLeft" size={20} />
              </button>
              <button
                type="button"
                onClick={() => goLook(1)}
                aria-label="Next look"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition-colors hover:bg-cream md:right-2 md:translate-x-0"
              >
                <Icon name="chevronRight" size={20} />
              </button>
            </>
          )}

          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:gap-10 lg:grid-cols-[1.4fr_1fr]">
            {/* Left — lifestyle image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-cream">
              <AppImage
                src={look.image}
                alt={`${title} look ${lookIndex + 1}`}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Right — product card + dots */}
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="w-full max-w-xs">
                <ProductCard product={product} />
              </div>

              {/* Dot indicators for products within this look */}
              {look.products.length > 1 && (
                <div className="flex gap-2" role="tablist" aria-label="Products in this look">
                  {look.products.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={i === productIndex % look.products.length}
                      aria-label={p.title}
                      onClick={() => goProduct(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        i === productIndex % look.products.length
                          ? "bg-ink"
                          : "bg-line hover:bg-muted"
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
