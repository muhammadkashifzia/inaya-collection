import Link from "next/link";
import { AppImage } from "@/components/atoms";

interface DiscoverMoreTileProps {
  href: string;
  image: string | null;
  remaining: number;
}

/** Blurred image tile shown after a product rail, linking to the full collection. */
export function DiscoverMoreTile({ href, image, remaining }: DiscoverMoreTileProps) {
  return (
    <Link
      href={href}
      className="relative block aspect-[3/4] overflow-hidden bg-[#ece8e2] text-[#111] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <AppImage
        src={image}
        alt=""
        fill
        sizes="(min-width: 750px) 25vw, 50vw"
        className="scale-[1.08] object-cover [object-position:center_12%] blur-[7px]"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-white/20 p-4">
        <span className="flex min-w-[148px] flex-col items-center gap-3 bg-white/80 px-3.5 pb-3.5 pt-4 text-center backdrop-blur-md">
          <span className="text-sm font-medium leading-[1.35] text-[#222]">
            {remaining > 0 ? `Discover ${remaining} More` : "View Collection"}
          </span>
          <span className="inline-flex min-h-9 items-center justify-center border border-black/5 bg-white px-4 text-[13px] font-semibold">
            Explore
          </span>
        </span>
      </span>
    </Link>
  );
}
