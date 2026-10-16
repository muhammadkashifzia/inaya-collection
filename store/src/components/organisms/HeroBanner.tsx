import { Image, ButtonLink, Heading } from "@/components/atoms";
import type { Banner } from "@/lib/types";

interface HeroBannerProps {
  banner: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  return (
    <section className="relative flex min-h-[60vh] items-center overflow-hidden md:min-h-[70vh]">
      {/* Desktop image */}
      <Image
        src={banner.image}
        alt=""
        fill
        sizes="100vw"
        className="hidden object-cover md:block"
        priority
      />
      {/* Mobile image */}
      <Image
        src={banner.mobileImage ?? banner.image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover md:hidden"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" aria-hidden />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
        <div className="max-w-xl">
          <Heading level={1} className="text-white">
            {banner.title}
          </Heading>
          {banner.subtitle && (
            <p className="mt-3 text-base text-white/80 md:text-lg">
              {banner.subtitle}
            </p>
          )}
          {banner.buttons.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:grid lg:grid-cols-4">
              {banner.buttons.map((btn, i) => (
                <ButtonLink
                  key={i}
                  href={btn.href}
                  variant={i === 0 ? "primary" : "light"}
                  size="md"
                >
                  {btn.label}
                </ButtonLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
