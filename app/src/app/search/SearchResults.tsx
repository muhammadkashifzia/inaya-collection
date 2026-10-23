"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/organisms";
import { api } from "@/lib/api";
import type { Product } from "@/types";

export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<{ q: string; items: Product[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    api
      .products({ q, perPage: 24 }, controller.signal)
      .then((r) => {
        setResults({ q, items: r.data, total: r.meta.total });
        setError(null);
      })
      .catch((e: Error) => e.name !== "AbortError" && setError("Search is unavailable right now. Please try again."));
    return () => controller.abort();
  }, [q]);

  const loading = q && results?.q !== q && !error;

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
            {results.total} result{results.total === 1 ? "" : "s"} for “{q}”
          </p>
          <ProductGrid products={results.items} emptyText="No products match your search." />
        </>
      ) : null}
    </>
  );
}
