import Link from "next/link";
import { Image, ButtonLink } from "@/components/atoms";

interface CollectionCardProps {
  href: string;
  image: string | null | undefined;
  remaining: number;
}

export function CollectionCard({ href, image, remaining }: CollectionCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-cream"
    >
      {/* Blurred background */}
      {image && (
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover blur-sm brightness-75 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {!image && (
        <span className="absolute inset-0 bg-ink/30" aria-hidden />
      )}

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center gap-3 p-4 text-center">
        {remaining > 0 && (
          <p className="text-sm font-semibold uppercase tracking-widest text-white">
            Discover {remaining} More
          </p>
        )}
        <ButtonLink href={href} variant="light" size="sm">
          {remaining > 0 ? "View All" : "View Collection"}
        </ButtonLink>
      </div>
    </Link>
  );
}
