import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/atoms";
import type { PaginationMeta } from "@/lib/types";

interface PaginationProps {
  meta: PaginationMeta;
  hrefFor: (page: number) => string;
}

function pageNumbers(current: number, last: number): (number | "…")[] {
  const pages: (number | "…")[] = [];
  const delta = 1;

  for (let i = 1; i <= last; i++) {
    if (
      i === 1 ||
      i === last ||
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return pages;
}

export function Pagination({ meta, hrefFor }: PaginationProps) {
  const { currentPage, lastPage } = meta;
  if (lastPage <= 1) return null;

  const pages = pageNumbers(currentPage, lastPage);

  const linkBase =
    "inline-flex h-9 min-w-9 items-center justify-center border text-sm font-medium transition-colors";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 py-8">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={hrefFor(currentPage - 1)}
          aria-label="Previous page"
          className={cn(linkBase, "border-ink/20 px-2 hover:border-ink")}
        >
          <Icon name="chevronLeft" size={16} />
        </Link>
      ) : (
        <span aria-hidden className={cn(linkBase, "cursor-not-allowed border-ink/10 px-2 opacity-40")}>
          <Icon name="chevronLeft" size={16} />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              linkBase,
              p === currentPage
                ? "border-brand bg-brand text-white"
                : "border-ink/20 hover:border-ink",
            )}
          >
            {p}
          </Link>
        ),
      )}

      {/* Next */}
      {currentPage < lastPage ? (
        <Link
          href={hrefFor(currentPage + 1)}
          aria-label="Next page"
          className={cn(linkBase, "border-ink/20 px-2 hover:border-ink")}
        >
          <Icon name="chevronRight" size={16} />
        </Link>
      ) : (
        <span aria-hidden className={cn(linkBase, "cursor-not-allowed border-ink/10 px-2 opacity-40")}>
          <Icon name="chevronRight" size={16} />
        </span>
      )}
    </nav>
  );
}
