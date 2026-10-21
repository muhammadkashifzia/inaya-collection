import { AppImage, Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import type { Banner } from "@/types";
import Link from "next/link";

/** Dynamic collection strip — banners managed from admin (placement "collection_strip"). */
export function WinterCollections({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="py-14 md:py-10">
      <Container>
        <SectionHeader title="Our Recent Winter Unstitched Collections" />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:gap-4 md:overflow-visible">
          {banners.map((b) => {
            const href = b.buttons[0]?.href ?? "/collections/all";
            return (
              <Link
                key={b.id}
                href={href}
                className="group relative flex-shrink-0 overflow-hidden rounded-xl md:flex-1"
              >
                <div className="relative h-[130px] w-[300px] md:h-[150px] md:w-auto">
                  <AppImage
                    src={b.image}
                    alt={b.title}
                    fill
                    sizes="(min-width: 768px) 25vw, 300px"
                    className="object-cover object-left transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Text overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <span className="font-heading text-2xl font-semibold tracking-wide text-white drop-shadow-lg md:text-3xl">
                      {b.title}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
