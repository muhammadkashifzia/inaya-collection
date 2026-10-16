import Link from "next/link";
import { cn } from "@/lib/utils";
import { Container, Image, Badge } from "@/components/atoms";
import { SectionTitle } from "./SectionTitle";
import type { Category } from "@/lib/types";

interface CategoryGridProps {
  title: string;
  collections: Category[];
}

export function CategoryGrid({ title, collections }: CategoryGridProps) {
  if (collections.length === 0) return null;

  return (
    <section>
      <Container>
        <SectionTitle title={title} />
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {collections.map((cat) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="group relative flex aspect-[3/4] flex-col items-center justify-end overflow-hidden bg-cream p-4 text-center"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                {cat.rank > 0 && (
                  <Badge tone="sale" className="mb-1">
                    #{cat.rank}
                  </Badge>
                )}
                <h3 className="font-heading text-base font-semibold tracking-wide text-white md:text-lg">
                  {cat.title}
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80 transition-colors group-hover:text-white">
                  Shop now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
