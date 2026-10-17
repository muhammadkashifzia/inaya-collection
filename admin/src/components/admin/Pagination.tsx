import type { Paginated } from "@/types/api";
import { cn } from "@/utils";

/** Server-side pagination controls for Laravel paginated responses. */
export default function Pagination({ meta, onPage }: { meta?: Paginated<unknown>["meta"] | null; onPage: (page: number) => void }) {
  if (!meta) return null;
  if (meta.last_page <= 1) {
    return meta.total > 0 ? <p className="mt-4 text-theme-xs text-gray-500">{meta.total} result{meta.total === 1 ? "" : "s"}</p> : null;
  }

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= meta.last_page; p++) {
    if (p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1) pages.push(p);
    else if (pages.at(-1) !== "…") pages.push("…");
  }

  const btn = "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition";

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-theme-xs text-gray-500 dark:text-gray-400">
        Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <button type="button" className={cn(btn, "ring-1 ring-gray-200 disabled:opacity-40 dark:ring-gray-700")} disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} aria-label="Previous page">
            <span className="rtl:rotate-180">‹</span>
          </button>
        </li>
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === meta.current_page ? "page" : undefined}
                className={cn(btn, p === meta.current_page ? "bg-ink-900 text-white dark:bg-white/15" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5")}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" className={cn(btn, "ring-1 ring-gray-200 disabled:opacity-40 dark:ring-gray-700")} disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} aria-label="Next page">
            <span className="rtl:rotate-180">›</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
