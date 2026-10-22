"use client";

import { useCallback, useEffect, useRef, useState, Children, type ReactNode } from "react";
import { cn } from "@/lib/format";

const AUTOPLAY_MS = 4000;

interface MobileSliderProps {
  children: ReactNode;
  className?: string;
}

/**
 * On mobile (< md) renders a full-width auto-sliding carousel — one card
 * visible at a time, dot indicators, no arrows.
 * On md+ the children render in a normal flex row (pass-through).
 */
export function MobileSlider({ children, className }: MobileSliderProps) {
  const items = Children.toArray(children);
  const total = items.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- autoplay ---- */
  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % total);
      }, AUTOPLAY_MS);
    }
  }, [total]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetAutoplay]);

  /* ---- scroll to current slide ---- */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[current] as HTMLElement | undefined;
    if (slide) {
      track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    }
  }, [current]);

  /* ---- sync dots on manual swipe ---- */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const w = track.clientWidth;
        if (w === 0) return;
        const idx = Math.round(track.scrollLeft / w);
        setCurrent(idx);
        resetAutoplay();
      }, 80);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  }, [resetAutoplay]);

  if (total === 0) return null;

  return (
    <>
      {/* Mobile: slider */}
      <div className={cn("md:hidden", className)}>
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
        >
          {items.map((child, i) => (
            <div key={i} className="w-full min-w-full flex-shrink-0 snap-center px-1">
              {child}
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {total > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  setCurrent(i);
                  resetAutoplay();
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === current
                    ? "w-6 bg-ink"
                    : "w-1.5 bg-ink/25",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: normal flex row */}
      <div className={cn("hidden gap-3 md:flex md:gap-4", className)}>
        {items}
      </div>
    </>
  );
}
