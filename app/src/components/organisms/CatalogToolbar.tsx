"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/atoms";
import { cn } from "@/lib/format";
import type { Facets } from "@/types";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "latest", label: "Newest" },
  { value: "popularity", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/**
 * Filters and sorting are stored in the URL (?sort=&min_price=…), so every
 * combination is shareable and rendered on the server.
 */
export function CatalogToolbar({ total, facets }: { total: number; facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | string[] | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
      else if (value) next.set(key, value);
    });
    next.delete("page");
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  const selectedFabrics = params.getAll("fabric");
  const activeCount = ["min_price", "max_price", "availability", "on_sale", "pieces"].filter((k) => params.get(k)).length + selectedFabrics.length;

  return (
    <div className="mb-6 border-y border-line" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="catalog-filters"
            className="inline-flex items-center gap-2 font-semibold uppercase tracking-widest hover:text-brand"
          >
            <Icon name="grid" size={16} /> Filter {activeCount > 0 && `(${activeCount})`}
          </button>
          <p className="text-muted" aria-live="polite">
            {pending ? "Updating…" : `${total} product${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <label className="flex items-center gap-2">
          <span className="text-muted">Sort by</span>
          <select
            value={params.get("sort") ?? "featured"}
            onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form
        id="catalog-filters"
        hidden={!open}
        className="grid gap-6 border-t border-line py-5 text-sm md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          update({
            min_price: (data.get("min_price") as string) || null,
            max_price: (data.get("max_price") as string) || null,
            availability: (data.get("availability") as string) || null,
            on_sale: data.get("on_sale") ? "1" : null,
            pieces: (data.get("pieces") as string) || null,
            fabric: data.getAll("fabric") as string[],
          });
        }}
      >
        <fieldset>
          <legend className="mb-2 font-semibold uppercase tracking-widest">Price (Rs.)</legend>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="min_price">Minimum price</label>
            <input id="min_price" name="min_price" type="number" min={0} inputMode="numeric" placeholder={String(Math.floor(facets.price.min))}
              defaultValue={params.get("min_price") ?? ""} className="h-10 w-full border border-line px-3" />
            <span aria-hidden="true">–</span>
            <label className="sr-only" htmlFor="max_price">Maximum price</label>
            <input id="max_price" name="max_price" type="number" min={0} inputMode="numeric" placeholder={String(Math.ceil(facets.price.max))}
              defaultValue={params.get("max_price") ?? ""} className="h-10 w-full border border-line px-3" />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-semibold uppercase tracking-widest">Availability</legend>
          <label className="flex items-center gap-2 py-1">
            <input type="radio" name="availability" value="" defaultChecked={!params.get("availability")} /> All
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="radio" name="availability" value="in_stock" defaultChecked={params.get("availability") === "in_stock"} /> In stock
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" name="on_sale" value="1" defaultChecked={params.get("on_sale") === "1"} /> On sale
          </label>
        </fieldset>

        {facets.fabrics.length > 0 && (
          <fieldset>
            <legend className="mb-2 font-semibold uppercase tracking-widest">Fabric</legend>
            {facets.fabrics.map((f) => (
              <label key={f} className="flex items-center gap-2 py-1">
                <input type="checkbox" name="fabric" value={f} defaultChecked={selectedFabrics.includes(f)} /> {f}
              </label>
            ))}
          </fieldset>
        )}

        <div className="flex flex-col gap-4">
          {facets.pieces.length > 0 && (
            <label className="flex flex-col gap-2">
              <span className="font-semibold uppercase tracking-widest">Pieces</span>
              <select name="pieces" defaultValue={params.get("pieces") ?? ""} className="h-10 border border-line bg-white px-3">
                <option value="">Any</option>
                {facets.pieces.map((p) => (
                  <option key={p} value={p}>{p} Piece</option>
                ))}
              </select>
            </label>
          )}
          <div className="mt-auto flex gap-2">
            <button type="submit" className="h-10 flex-1 bg-ink px-4 text-xs font-semibold uppercase tracking-widest text-white">
              Apply
            </button>
            <button
              type="button"
              onClick={() => update({ min_price: null, max_price: null, availability: null, on_sale: null, pieces: null, fabric: [] })}
              className={cn("h-10 border border-line px-4 text-xs font-semibold uppercase tracking-widest", activeCount === 0 && "opacity-50")}
            >
              Clear
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
