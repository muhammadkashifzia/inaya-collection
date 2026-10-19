import { AppImage, Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import Link from "next/link";

const collections = [
  { label: "Silk", image: "/clothes/Anaya Silk 358x150.png", href: "/collections/all" },
  { label: "Cambric", image: "/clothes/Anaya Cambric 358x150.png", href: "/collections/all" },
  { label: "Lawn", image: "/clothes/Anaya Lawn 358x150.png", href: "/collections/all" },
  { label: "Velvet", image: "/clothes/Anaya Velvet 358x150.png", href: "/collections/all" },
] as const;

/** Static banner strip showcasing winter unstitched fabric types. */
export function WinterCollections() {
  return (
    <section className="py-14 md:py-15">
      <Container>
        <SectionHeader title="Our Recent Winter Unstitched Collections" />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:gap-4 md:overflow-visible">
          {collections.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group relative flex-shrink-0 overflow-hidden rounded-xl md:flex-1"
            >
              <div className="relative h-[130px] w-[300px] md:h-[150px] md:w-auto">
                <AppImage
                  src={c.image}
                  alt={c.label}
                  fill
                  sizes="(min-width: 768px) 25vw, 300px"
                  className="object-cover object-left transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
