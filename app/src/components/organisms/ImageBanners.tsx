import Link from "next/link";
import { AppImage, Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import type { ImageBannerItem } from "@/types";

/**
 * Row of wide image cards (e.g. Silk / Lawn / Velvet) with the admin's text
 * drawn over each background image. Scrolls sideways when there are more
 * cards than fit: 1 on phones, 2 on tablets, 4 on desktop.
 */
export function ImageBanners({ title, items }: { title: string; items: ImageBannerItem[] }) {
  return (
    <section className="py-8 md:py-12">
      <Container>
        {title && <SectionHeader title={title} />}
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:-mx-6 md:gap-4 md:scroll-px-6 md:px-6 [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => (
            <li key={i} className="shrink-0 basis-[85%] snap-start sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]">
              <ImageBannerCard item={item} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function ImageBannerCard({ item }: { item: ImageBannerItem }) {
  const label = [item.subtitle, item.title].filter(Boolean).join(" ");
  const isLeft = item.align === "left";
  const body = (
    <>
      <AppImage
        src={item.image}
        alt={item.href ? "" : label}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {label && (
        <>
          <span
            className={isLeft ? "absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" : "absolute inset-0 bg-black/20"}
            aria-hidden="true"
          />
          <span
            className={`absolute inset-y-0 flex flex-col justify-center text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] ${
              isLeft ? "left-0 w-3/5 items-start ps-5 text-left md:ps-7" : "inset-x-0 items-start px-4 text-center"
            }`}
          >
            {item.subtitle && <span className="font-heading text-sm italic md:text-base">{item.subtitle}</span>}
            {item.title && <span className="font-heading text-3xl font-bold leading-none tracking-wide md:text-4xl">{item.title}</span>}
          </span>
        </>
      )}
    </>
  );
  const className = "group relative block aspect-[12/5] overflow-hidden rounded-xl bg-cream";

  return item.href ? (
    <Link href={item.href} aria-label={label || undefined} className={`${className} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
