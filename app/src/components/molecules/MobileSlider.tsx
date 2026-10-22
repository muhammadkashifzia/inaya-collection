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
 * visible at a time, dot indicators, no arrows. Uses translate for sliding.
 * On md+ the children render in a normal flex row (pass-through).
 */
export function MobileSlider({ children, className }: MobileSliderProps) {
  const items = Children.toArray(children);
  const total = items.length;
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  /* ---- swipe handlers ---- */
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % total);
      } else {
        setCurrent((prev) => (prev - 1 + total) % total);
      }
      resetAutoplay();
    }
    setTouchStart(null);
  };

  if (total === 0) return null;

  return (
    <>
      {/* Mobile: slider with translate */}
      <div
        className={cn("overflow-hidden md:hidden", className)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((child, i) => (
            <div key={i} className="w-full min-w-full flex-shrink-0 px-1">
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
