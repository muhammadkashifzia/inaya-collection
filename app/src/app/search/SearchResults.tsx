"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/organisms";
import { api } from "@/lib/api";
import type { PaginationMeta, Product } from "@/types";

export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<{ q: string; page: number; items: Product[]; meta: PaginationMeta } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    api
      .products({ q, perPage: 24, page }, controller.signal)
      .then((r) => {
        setResults({ q, page, items: r.data, meta: r.meta });
        setError(null);
      })
      .catch((e: Error) => e.name !== "AbortError" && setError("Search is unavailable right now. Please try again."));
    return () => controller.abort();
  }, [q, page]);

  const loading = q && (results?.q !== q || results?.page !== page) && !error;

  function pageHref(p: number): string {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    return `${pathname}?${sp}`;
  }

  return (
    <>
      <form
        role="search"
        className="mb-8 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`${pathname}?q=${encodeURIComponent(input.trim())}`);
        }}
      >
        <label htmlFor="search-page-input" className="sr-only">Search products</label>
        <input
          id="search-page-input"
          type="search"
          value={input}
          maxLength={100}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search khaddar, karandi, colours…"
          className="h-11 flex-1 border border-line px-4 text-sm outline-none focus:border-ink"
        />
        <button type="submit" className="h-11 bg-ink px-5 text-xs font-semibold uppercase tracking-widest text-white">
          Search
        </button>
      </form>
      {error && <p role="alert" className="mb-6 text-error">{error}</p>}
      {!q ? (
        <p className="text-muted">Type a fabric, colour or design to start.</p>
      ) : loading ? (
        <ProductGridSkeleton />
      ) : results ? (
        <>
          <p className="mb-6 text-sm text-muted" aria-live="polite">
            {results.meta.total} result{results.meta.total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
          </p>
          <ProductGrid products={results.items} emptyText="No products match your search." />
          {results.meta.lastPage > 1 && (
            <SearchPagination meta={results.meta} hrefFor={pageHref} onNavigate={(p) => router.push(pageHref(p))} />
          )}
        </>
      ) : null}
    </>
  );
}

/**
 * Client-side pagination for search results. Uses buttons with router.push
 * since search results are fetched client-side via useEffect.
 */
function SearchPagination({ meta, hrefFor, onNavigate }: { meta: PaginationMeta; hrefFor: (page: number) => string; onNavigate: (page: number) => void }) {
  const pages = buildPageRange(meta.currentPage, meta.lastPage);

  return (
    <nav aria-label="Search results pagination" className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        {meta.currentPage > 1 && (
          <li>
            <a href={hrefFor(meta.currentPage - 1)} onClick={(e) => { e.preventDefault(); onNavigate(meta.currentPage - 1); }} className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted hover:text-ink">
              Previous
            </a>
          </li>
        )}
        {pages.map((p, i) =>
          p === null ? (
            <li key={`dot-${i}`} aria-hidden="true" className="px-1 text-sm text-muted">…</li>
          ) : (
            <li key={p}>
              <a
                href={hrefFor(p)}
                onClick={(e) => { e.preventDefault(); onNavigate(p); }}
                aria-current={p === meta.currentPage ? "page" : undefined}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded text-sm font-medium ${p === meta.currentPage ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
              >
                {p}
              </a>
            </li>
          ),
        )}
        {meta.currentPage < meta.lastPage && (
          <li>
            <a href={hrefFor(meta.currentPage + 1)} onClick={(e) => { e.preventDefault(); onNavigate(meta.currentPage + 1); }} className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted hover:text-ink">
              Next
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}

/** Build a page range with ellipsis gaps, e.g. [1, null, 4, 5, 6, null, 10] */
function buildPageRange(current: number, last: number): (number | null)[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages: (number | null)[] = [];
  const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  addPage(1);
  for (let p = Math.max(2, current - 1); p <= Math.min(last - 1, current + 1); p++) addPage(p);
  addPage(last);
  // Insert ellipsis gaps
  const withGaps: (number | null)[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && (pages[i] as number) - (pages[i - 1] as number) > 1) withGaps.push(null);
    withGaps.push(pages[i]);
  }
  return withGaps;
}
