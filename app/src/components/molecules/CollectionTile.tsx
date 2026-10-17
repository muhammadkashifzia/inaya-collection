import Link from "next/link";
import { AppImage } from "@/components/atoms";
import type { Collection } from "@/types";

export function CollectionTile({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <AppImage
        src={collection.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
      <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-ink">
        {String(collection.rank).padStart(2, "0")}
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 text-white">
        <span className="block font-heading text-xl font-semibold">{collection.shortTitle}</span>
        <span className="mt-1 inline-block text-xs uppercase tracking-widest underline-offset-4 group-hover:underline">
          Shop now
        </span>
      </span>
    </Link>
  );
}
