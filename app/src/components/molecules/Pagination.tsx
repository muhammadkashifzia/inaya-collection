import Link from "next/link";
import { cn } from "@/lib/format";
import type { PaginationMeta } from "@/types";

/**
 * Server-side pagination using real links (crawlable, works without JS).
 */
export function Pagination({ meta, hrefFor }: { meta: PaginationMeta; hrefFor: (page: number) => string }) {
  if (meta.lastPage <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= meta.lastPage; p++) {
    if (p === 1 || p === meta.lastPage || Math.abs(p - meta.currentPage) <= 1) pages.push(p);
    else if (pages.at(-1) !== "…") pages.push("…");
  }

  const item = "flex h-10 min-w-10 items-center justify-center border px-3 text-sm";

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        {meta.currentPage > 1 && (
          <li>
            <Link href={hrefFor(meta.currentPage - 1)} rel="prev" className={cn(item, "border-line hover:border-ink")}>
              Previous
            </Link>
          </li>
        )}
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === meta.currentPage ? "page" : undefined}
                className={cn(item, p === meta.currentPage ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        {meta.currentPage < meta.lastPage && (
          <li>
            <Link href={hrefFor(meta.currentPage + 1)} rel="next" className={cn(item, "border-line hover:border-ink")}>
              Next
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
