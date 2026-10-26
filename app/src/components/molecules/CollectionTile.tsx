import Link from "next/link";
import { AppImage } from "@/components/atoms";
import type { Collection } from "@/types";

const PIECE_PATTERN = /(\d+)\s*-?\s*(?:pcs?|pieces?)\b/i;

/**
 * Splits a category name like "3 PC Khaddar" / "Winter 3 Piece Khaddar" into
 * a piece badge ("3 PIECE") and a display label ("KHADDAR").
 */
function splitLabel({ shortTitle, title }: Collection): { badge: string | null; label: string } {
  const source = PIECE_PATTERN.test(shortTitle) ? shortTitle : title;
  const match = source.match(PIECE_PATTERN);
  const badge = match ? `${match[1]} Piece` : null;
  const stripped = shortTitle.replace(PIECE_PATTERN, "").replace(/\s{2,}/g, " ").trim();

  return { badge, label: stripped || shortTitle };
}

export function CollectionTile({ collection }: { collection: Collection }) {
  const { badge, label } = splitLabel(collection);

  return (
    <div className="relative pl-4 md:pl-6">
      {/* Large faded rank number peeking out from behind the tile */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-0 select-none font-heading text-[60px] font-black leading-none text-black/[0.06] sm:text-[90px] md:text-[140px]"
      >
        {collection.rank || ""}
      </span>

      <Link
        href={`/collections/${collection.slug}`}
        className="group relative z-10 block aspect-[2/3] overflow-hidden rounded-md bg-cream shadow-[0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-transparent transition-shadow hover:ring-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <AppImage
          src={collection.image}
          alt={`${collection.title} collection`}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent" aria-hidden="true" />

        {badge && (
          <span className="absolute bottom-10 left-2 rounded-[3px] bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-wide text-ink sm:bottom-12 sm:left-3 sm:px-2 sm:py-1 sm:text-[10px] md:bottom-14 md:text-[11px]">
            {badge}
          </span>
        )}

        <span className="absolute inset-x-0 bottom-0 px-2 pb-2 text-center text-xs font-bold uppercase tracking-wide text-white sm:px-3 sm:pb-3 sm:text-sm md:pb-4 md:text-lg">
          {label}
          <span className="sr-only"> collection</span>
        </span>
      </Link>
    </div>
  );
}
