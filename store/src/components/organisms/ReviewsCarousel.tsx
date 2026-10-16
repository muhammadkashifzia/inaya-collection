"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Container, Image } from "@/components/atoms";
import { SectionTitle } from "./SectionTitle";
import type { Review } from "@/lib/types";

interface ReviewsCarouselProps {
  title: string;
  reviews: Review[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-amber-500" aria-label={`${rating} star rating`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={cn("h-4 w-4", i < rating ? "fill-current" : "fill-muted/30")}
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
      <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden>
        <path
          fill="currentColor"
          d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.4 6.4-3.7 3.8-1.5-1.5-.9.9 2.4 2.4 4.6-4.7-.9-.9z"
        />
      </svg>
      Verified Purchase
    </span>
  );
}

export function ReviewsCarousel({ title, reviews }: ReviewsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 2);
    setCanScrollRight(track.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-review-card]");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 20;
    const step = card.getBoundingClientRect().width + gap;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="overflow-hidden py-12 md:py-16">
      <Container>
        <SectionTitle title={title} />
      </Container>

      <div className="relative">
        {/* Navigation arrows */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="absolute start-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-white md:flex"
            aria-label="Previous reviews"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll(1)}
            className="absolute end-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-white md:flex"
            aria-label="Next reviews"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={trackRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 md:px-6"
          role="region"
          aria-label={title}
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              data-review-card
              className="flex w-[280px] flex-none snap-start flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm md:w-[300px]"
            >
              {/* Reviewer photo */}
              {review.image && (
                <div className="relative aspect-square w-full bg-cream">
                  <Image
                    src={review.image}
                    alt={review.name}
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Review body */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <StarRating rating={review.rating} />
                <h3 className="text-sm font-semibold text-ink">
                  {review.title}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-muted">
                  &ldquo;{review.quote}&rdquo;
                </p>

                {/* Meta: name + verified */}
                <div className="mt-2 flex items-end justify-between border-t border-line pt-2">
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      {review.name}
                    </p>
                    {review.date && (
                      <p className="text-[11px] text-muted">{review.date}</p>
                    )}
                  </div>
                  {review.verified && <VerifiedBadge />}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
