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
  subtitle?: string;
  looks: Look[];
}

/**
 * "Shop the Look"
 * Desktop: lifestyle image left + product card right.
 * Mobile: only the lifestyle image as a swipeable slider with "View Product" overlay.
 * Arrows cycle looks; dots cycle products (desktop only).
 */
export function ShopTheLook({ title, subtitle, looks }: ShopTheLookProps) {
  const validLooks = looks.filter((l) => l.image && l.products.length > 0);
  const [lookIdx, setLookIdx] = useState(0);
  const [prodIdx, setProdIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  if (validLooks.length === 0) return null;

  const look = validLooks[lookIdx % validLooks.length];
  const product = look.products[prodIdx % look.products.length];
  const href = `/products/${product.slug}`;
  const secondImage = product.images.length > 1 ? product.images[1] : null;

  function goLook(dir: -1 | 1) {
    setLookIdx((i) => (i + dir + validLooks.length) % validLooks.length);
    setProdIdx(0);
    setHovered(false);
  }

  return (
    <section className="relative py-10 md:py-14 overflow-hidden">
      {/* ── Decorative corner ornaments ── */}
      <svg aria-hidden="true" className="pointer-events-none absolute -left-4 -top-4 h-44 w-44 sm:h-56 sm:w-56 md:h-72 md:w-72" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 C40 10, 70 40, 80 80 C60 60, 30 30, 0 0Z" fill="#0b1d36" fillOpacity="0.04" />
        <path d="M0 0 C20 30, 40 60, 50 100 C30 70, 10 35, 0 0Z" fill="#0b1d36" fillOpacity="0.03" />
        <path d="M5 70 Q30 60 55 30 Q45 55 15 75Z" fill="#0b1d36" fillOpacity="0.025" />
        <path d="M10 10 C30 15, 50 35, 60 60" stroke="#0b1d36" strokeOpacity="0.08" strokeWidth="1" fill="none" />
        <path d="M0 50 C20 45, 35 30, 50 0" stroke="#0b1d36" strokeOpacity="0.06" strokeWidth="0.75" fill="none" />
        <path d="M0 80 C30 70, 55 50, 80 0" stroke="#0b1d36" strokeOpacity="0.05" strokeWidth="0.5" fill="none" strokeDasharray="4 6" />
        <circle cx="15" cy="15" r="3" fill="#0b1d36" fillOpacity="0.08" />
        <circle cx="40" cy="8" r="2" fill="#0b1d36" fillOpacity="0.06" />
        <circle cx="8" cy="42" r="2" fill="#0b1d36" fillOpacity="0.06" />
        <circle cx="55" cy="20" r="1.5" fill="#0b1d36" fillOpacity="0.05" />
        <circle cx="22" cy="58" r="1.5" fill="#0b1d36" fillOpacity="0.05" />
      </svg>
      <svg aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-4 h-44 w-44 sm:h-56 sm:w-56 md:h-72 md:w-72" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M200 200 C160 190, 130 160, 120 120 C140 140, 170 170, 200 200Z" fill="#0b1d36" fillOpacity="0.04" />
        <path d="M200 200 C180 170, 160 140, 150 100 C170 130, 190 165, 200 200Z" fill="#0b1d36" fillOpacity="0.03" />
        <path d="M195 130 Q170 140 145 170 Q155 145 185 125Z" fill="#0b1d36" fillOpacity="0.025" />
        <path d="M190 190 C170 185, 150 165, 140 140" stroke="#0b1d36" strokeOpacity="0.08" strokeWidth="1" fill="none" />
        <path d="M200 150 C180 155, 165 170, 150 200" stroke="#0b1d36" strokeOpacity="0.06" strokeWidth="0.75" fill="none" />
        <path d="M200 120 C170 130, 145 150, 120 200" stroke="#0b1d36" strokeOpacity="0.05" strokeWidth="0.5" fill="none" strokeDasharray="4 6" />
        <circle cx="185" cy="185" r="3" fill="#0b1d36" fillOpacity="0.08" />
        <circle cx="160" cy="192" r="2" fill="#0b1d36" fillOpacity="0.06" />
        <circle cx="192" cy="158" r="2" fill="#0b1d36" fillOpacity="0.06" />
        <circle cx="145" cy="180" r="1.5" fill="#0b1d36" fillOpacity="0.05" />
        <circle cx="178" cy="142" r="1.5" fill="#0b1d36" fillOpacity="0.05" />
      </svg>

      <Container>
        <SectionHeader title={title} subtitle={subtitle} />

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

          {/* ── Mobile: lifestyle image only + View Product button ── */}
          <div className="md:hidden">
            <div className="relative aspect-[3/4] overflow-hidden bg-cream">
              <AppImage
                src={look.image}
                alt={`${title} look ${lookIdx + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              {/* Overlay button at bottom */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent pb-6 pt-16">
                <Link
                  href={href}
                  className="inline-block border border-white px-8 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-ink"
                >
                  View Product
                </Link>
              </div>
            </div>
            {/* Mobile dots for looks */}
            {validLooks.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {validLooks.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Look ${i + 1}`}
                    onClick={() => { setLookIdx(i); setProdIdx(0); }}
                    className={`h-2 w-2 rounded-full transition-colors ${i === lookIdx % validLooks.length ? "bg-ink" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Desktop: lifestyle image + product card ── */}
          <div className="mx-auto hidden max-w-[800px] gap-12 md:grid md:grid-cols-[1.3fr_1fr] lg:gap-16">
            {/* Left — lifestyle image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-cream">
              <AppImage
                src={look.image}
                alt={`${title} look ${lookIdx + 1}`}
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Right — product detail card */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-[280px]">
                {/* Product image with hover swap + wishlist */}
                <div
                  className="relative mb-5"
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                >
                  <Link
                    href={href}
                    className="relative block aspect-[3/4] overflow-hidden bg-cream"
                  >
                    <AppImage
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="280px"
                      className={`object-cover transition-opacity duration-500 ${hovered && secondImage ? "opacity-0" : "opacity-100"}`}
                    />
                    {secondImage && (
                      <AppImage
                        src={secondImage}
                        alt={product.title}
                        fill
                        sizes="280px"
                        className={`object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
                      />
                    )}
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

              {/* Dot indicators for products */}
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
