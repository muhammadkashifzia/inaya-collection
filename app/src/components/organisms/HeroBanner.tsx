import { AppImage, ButtonLink } from "@/components/atoms";
import type { Banner } from "@/types";

/** Hero banner managed from the admin (placement "hero"). */
export function HeroBanner({ banner }: { banner: Banner }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <div className="relative h-[70vh] min-h-[420px] md:h-[600px]">
        <AppImage src={banner.mobileImage ?? banner.image} alt="" fill preload sizes="100vw" className="object-cover md:hidden" />
        <AppImage src={banner.image} alt="" fill preload sizes="100vw" className="hidden object-cover md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" aria-hidden="true" />
        <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-14 text-center text-white md:justify-center md:pb-0">
          <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight md:text-6xl">{banner.title}</h1>
          {banner.subtitle && <p className="mt-4 max-w-xl text-sm text-white/85 md:text-base">{banner.subtitle}</p>}
          {banner.buttons.length > 0 && (
            <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
              {banner.buttons.map((cta) => (
                <ButtonLink key={`${cta.href}-${cta.label}`} href={cta.href} variant="light" size="md">
                  {cta.label}
                </ButtonLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
