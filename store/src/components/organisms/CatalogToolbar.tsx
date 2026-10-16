"use client";

import { useState, useCallback, useId } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, Icon } from "@/components/atoms";
import type { Facets } from "@/lib/types";

interface CatalogToolbarProps {
  total: number;
  facets: Facets;
}

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
] as const;

export function CatalogToolbar({ total, facets }: CatalogToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formId = useId();

  const [open, setOpen] = useState(false);

  /* Current param values */
  const currentSort = searchParams.get("sort") ?? "featured";

  /* Local filter state, seeded from URL */
  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") ?? "");
  const [availability, setAvailability] = useState(searchParams.get("availability") ?? "all");
  const [onSale, setOnSale] = useState(searchParams.get("on_sale") === "1");
  const [fabrics, setFabrics] = useState<Set<string>>(
    new Set(searchParams.getAll("fabric")),
  );
  const [pieces, setPieces] = useState(searchParams.get("pieces") ?? "");

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "" || v === "all") sp.delete(k);
        else sp.set(k, v);
      }
      sp.delete("page"); // reset to page 1
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const handleSort = (value: string) => pushParams({ sort: value === "featured" ? null : value });

  const applyFilters = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("price_min");
    sp.delete("price_max");
    sp.delete("availability");
    sp.delete("on_sale");
    sp.delete("fabric");
    sp.delete("pieces");
    sp.delete("page");

    if (priceMin) sp.set("price_min", priceMin);
    if (priceMax) sp.set("price_max", priceMax);
    if (availability !== "all") sp.set("availability", availability);
    if (onSale) sp.set("on_sale", "1");
    fabrics.forEach((f) => sp.append("fabric", f));
    if (pieces) sp.set("pieces", pieces);

    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  const clearFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setAvailability("all");
    setOnSale(false);
    setFabrics(new Set());
    setPieces("");
    router.push(pathname);
    setOpen(false);
  };

  const toggleFabric = (f: string) => {
    setFabrics((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  return (
    <div className="mb-6 flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {total} {total === 1 ? "product" : "products"}
        </p>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <label htmlFor={`${formId}-sort`} className="sr-only">
            Sort by
          </label>
          <select
            id={`${formId}-sort`}
            value={currentSort}
            onChange={(e) => handleSort(e.target.value)}
            className="h-9 border border-ink/20 bg-white px-3 text-xs font-medium uppercase tracking-widest outline-none focus:border-ink"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex h-9 items-center gap-1.5 border border-ink/20 px-3 text-xs font-medium uppercase tracking-widest transition-colors hover:border-ink"
          >
            <Icon name="grid" size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* Expandable filter panel */}
      {open && (
        <div className="border border-ink/10 bg-white p-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Price range */}
            <fieldset>
              <legend className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                Price Range
              </legend>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={facets.price.min}
                  max={facets.price.max}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder={`${facets.price.min}`}
                  aria-label="Minimum price"
                  className="h-9 w-full border border-ink/20 bg-white px-2 text-sm outline-none focus:border-ink"
                />
                <span className="text-xs text-muted">–</span>
                <input
                  type="number"
                  min={facets.price.min}
                  max={facets.price.max}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder={`${facets.price.max}`}
                  aria-label="Maximum price"
                  className="h-9 w-full border border-ink/20 bg-white px-2 text-sm outline-none focus:border-ink"
                />
              </div>
            </fieldset>

            {/* Availability */}
            <fieldset>
              <legend className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                Availability
              </legend>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: "all", label: "All" },
                  { value: "in-stock", label: "In Stock" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`${formId}-availability`}
                      value={opt.value}
                      checked={availability === opt.value}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="accent-brand"
                    />
                    {opt.label}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={onSale}
                    onChange={(e) => setOnSale(e.target.checked)}
                    className="accent-brand"
                  />
                  On Sale
                </label>
              </div>
            </fieldset>

            {/* Fabric */}
            {facets.fabrics.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                  Fabric
                </legend>
                <div className="flex flex-col gap-1.5">
                  {facets.fabrics.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={fabrics.has(f)}
                        onChange={() => toggleFabric(f)}
                        className="accent-brand"
                      />
                      {f}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Pieces */}
            {facets.pieces.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                  Pieces
                </legend>
                <select
                  value={pieces}
                  onChange={(e) => setPieces(e.target.value)}
                  aria-label="Filter by number of pieces"
                  className="h-9 w-full border border-ink/20 bg-white px-2 text-sm outline-none focus:border-ink"
                >
                  <option value="">All</option>
                  {facets.pieces.map((p) => (
                    <option key={p} value={p}>
                      {p} piece{p !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
