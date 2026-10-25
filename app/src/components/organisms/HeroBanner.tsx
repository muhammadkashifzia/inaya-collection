"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppImage, ButtonLink, Container, Icon } from "@/components/atoms";
import { cn } from "@/lib/format";
import type { Banner } from "@/types";

const AUTOPLAY_MS = 5000;

/** Hero banner slider — cycles through all active banners with autoplay. */
export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = banners.length;

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

  const goTo = (index: number) => {
    setCurrent(index);
    resetAutoplay();
  };

  const prev = () => goTo((current - 1 + total) % total);
  const next = () => goTo((current + 1) % total);

  if (total === 0) return null;

  // Single banner — no slider controls needed
  if (total === 1) return <Slide banner={banners[0]} />;

  return (
    <section className="group relative isolate overflow-hidden bg-ink">
      {/* Slides */}
      <div className="relative h-[70vh] min-h-[420px] md:h-[600px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === current ? "z-10 opacity-100" : "z-0 opacity-0",
            )}
            aria-hidden={i !== current}
          >
            <SlideContent banner={banner} active={i === current} />
          </div>
        ))}
      </div>

      {/* Prev / Next arrows — visible on hover (desktop) and always on mobile */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous banner"
        className="absolute start-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 md:start-5 md:opacity-0 md:group-hover:opacity-100"
      >
        <Icon name="chevronLeft" className="size-5 md:size-6" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next banner"
        className="absolute end-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 md:end-5 md:opacity-0 md:group-hover:opacity-100"
      >
        <Icon name="chevronRight" className="size-5 md:size-6" />
      </button>

      {/* Dot indicators */}
      <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-2">
        {banners.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to banner ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === current ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75",
            )}
          />
        ))}
      </div>
    </section>
  );
}

/** Single full-screen slide (used when there's only 1 banner). */
function Slide({ banner }: { banner: Banner }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <div className="relative h-[70vh] min-h-[420px] md:h-[600px]">
        <SlideContent banner={banner} />
      </div>
    </section>
  );
}

/** Shared banner content: images, overlay, text, and CTA buttons. */
function SlideContent({ banner, active = true }: { banner: Banner; active?: boolean }) {
  return (
    <>
      <AppImage src={banner.mobileImage ?? banner.image} alt="" fill preload={active} sizes="100vw" className="object-cover md:hidden" />
      <AppImage src={banner.image} alt="" fill preload={active} sizes="100vw" className="hidden object-cover md:block" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 md:bg-gradient-to-r md:from-black/70 md:via-black/30 md:to-transparent" aria-hidden="true" />
      <Container className="absolute inset-0 flex flex-col items-start justify-end pb-14 text-left text-white md:justify-center md:pb-0">
        <h1
          className={cn(
            "max-w-xl font-heading text-4xl font-semibold leading-tight md:text-6xl transition-all duration-700 ease-out",
            active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
        >
          {banner.title}
        </h1>
        {banner.subtitle && (
          <p
            className={cn(
              "mt-4 max-w-md text-sm text-white/85 md:text-base transition-all duration-700 ease-out delay-150",
              active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            {banner.subtitle}
          </p>
        )}
        {banner.buttons.length > 0 && (
          <div
            className={cn(
              "mt-8 grid w-full max-w-xl grid-cols-2 gap-3 md:flex md:w-auto md:flex-wrap transition-all duration-700 ease-out delay-300",
              active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            {banner.buttons.map((cta) => (
              <ButtonLink key={`${cta.href}-${cta.label}`} href={cta.href} variant="light" size="md">
                {cta.label}
              </ButtonLink>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
