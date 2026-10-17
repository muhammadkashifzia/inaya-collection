/**
 * Server-side data layer. Every read goes to the Laravel API (`/api/v1`).
 * Results are cached for a short time ("minutes" profile) and tagged so they
 * can be revalidated on demand.
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { mapCollection, mapHome, mapPage, mapPaginated, mapProduct, mapSettings } from "@/lib/mappers";
import type { Collection, ContentPage, Facets, HomeData, Paginated, Product, ProductQuery, SiteConfig } from "@/types";

const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiUnavailableError extends Error {}

/**
 * GET a JSON endpoint. Returns null on 404; throws on other failures.
 */
async function getJson<T = unknown>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new ApiUnavailableError(`Could not reach the API at ${API_URL}: ${(error as Error).message}`);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API GET ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

export async function getSite(): Promise<SiteConfig> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  const json = await getJson<{ data: unknown }>("/settings");
  if (!json) throw new Error("Store settings not found");
  return mapSettings(json.data);
}

export async function getHome(): Promise<HomeData> {
  "use cache";
  cacheLife("minutes");
  cacheTag("home", "products");
  const json = await getJson<{ data: unknown }>("/home");
  return mapHome(json?.data ?? {});
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");
  const json = await getJson<unknown[]>("/categories");
  return (json ?? []).map(mapCollection);
}

export async function getCollection(slug: string): Promise<Collection | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories", `category:${slug}`);
  const json = await getJson(`/categories/${encodeURIComponent(slug)}`);
  return json ? mapCollection(json) : null;
}

export function productQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.perPage) params.set("per_page", String(query.perPage));
  if (query.minPrice != null) params.set("min_price", String(query.minPrice));
  if (query.maxPrice != null) params.set("max_price", String(query.maxPrice));
  if (query.availability) params.set("availability", query.availability);
  if (query.onSale) params.set("on_sale", "1");
  if (query.pieces) params.set("pieces", String(query.pieces));
  query.fabric?.forEach((f) => params.append("fabric[]", f));
  return params.toString();
}

export async function getProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const qs = productQueryString(query);
  const json = await getJson(`/products${qs ? `?${qs}` : ""}`);
  return mapPaginated(json ?? {}, mapProduct);
}

export async function getFacets(): Promise<Facets> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const json = await getJson<{ data: Facets }>("/products/filters");
  return json?.data ?? { fabrics: [], pieces: [], brands: [], price: { min: 0, max: 0 } };
}

export async function getProduct(slug: string): Promise<{ product: Product; related: Product[] } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);
  const json = await getJson<{ data: unknown; related: unknown[] }>(`/products/${encodeURIComponent(slug)}`);
  if (!json) return null;
  return { product: mapProduct(json.data), related: (json.related ?? []).map(mapProduct) };
}

export async function getContentPage(slug: string): Promise<ContentPage | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pages", `page:${slug}`);
  const json = await getJson<{ [k: string]: unknown }>(`/pages/${encodeURIComponent(slug)}`);
  return json ? mapPage(json) : null;
}

export async function getContentPages(): Promise<{ slug: string; title: string; updated_at: string | null }[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pages");
  const json = await getJson<{ data: { slug: string; title: string; updated_at: string | null }[] }>("/pages");
  return json?.data ?? [];
}

/**
 * Every product slug (for sitemap / static params). Walks the paginated API.
 */
export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string | null }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const slugs: { slug: string; updatedAt: string | null }[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await getProducts({ page, perPage: 48, sort: "latest" });
    result.data.forEach((p) => slugs.push({ slug: p.slug, updatedAt: p.updatedAt }));
    lastPage = result.meta.lastPage;
    page++;
  } while (page <= lastPage && page <= 50);
  return slugs;
}
