import type { ProductQuery, SortOption } from "@/types";

const SORTS: SortOption[] = ["featured", "latest", "price_asc", "price_desc", "popularity", "name"];

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const positive = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/**
 * Parse (and sanitise) catalog URL params into an API query.
 * Unknown values are dropped rather than forwarded.
 */
export function parseCatalogParams(params: SearchParams, category?: string): { query: ProductQuery; queryString: string } {
  const sort = first(params.sort) as SortOption | undefined;
  const page = Math.max(1, Math.floor(positive(first(params.page)) ?? 1));
  const fabricRaw = params.fabric;
  const fabric = (Array.isArray(fabricRaw) ? fabricRaw : fabricRaw ? [fabricRaw] : []).slice(0, 10).map((f) => f.slice(0, 60));
  const availability = first(params.availability);

  const query: ProductQuery = {
    category,
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    page,
    perPage: 24,
    minPrice: positive(first(params.min_price)),
    maxPrice: positive(first(params.max_price)),
    availability: availability === "in_stock" || availability === "out_of_stock" ? availability : undefined,
    onSale: first(params.on_sale) === "1" || undefined,
    pieces: positive(first(params.pieces)) || undefined,
    fabric: fabric.length ? fabric : undefined,
    q: first(params.q)?.slice(0, 100) || undefined,
  };

  // Keep the URL params (minus page) for pagination links.
  const qs = new URLSearchParams();
  if (query.sort && query.sort !== "featured") qs.set("sort", query.sort);
  if (query.minPrice != null) qs.set("min_price", String(query.minPrice));
  if (query.maxPrice != null) qs.set("max_price", String(query.maxPrice));
  if (query.availability) qs.set("availability", query.availability);
  if (query.onSale) qs.set("on_sale", "1");
  if (query.pieces) qs.set("pieces", String(query.pieces));
  if (query.q) qs.set("q", query.q);
  fabric.forEach((f) => qs.append("fabric", f));

  return { query, queryString: qs.toString() };
}
