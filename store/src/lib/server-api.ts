"use cache";

import { cacheLife, cacheTag } from "next/cache";
import type {
  Banner,
  Category,
  Facets,
  HomeData,
  HomeSection,
  Paginated,
  PaginationMeta,
  Product,
  Review,
  SiteSettings,
  StaticPage,
  Variant,
} from "@/lib/types";

/* ── Base URL ── */

const BASE =
  (process.env.API_URL ?? "https://inaya-api.eastlogic.com").replace(
    /\/$/,
    "",
  );

/* ── Number coercion ── */

const num = (v: unknown): number =>
  typeof v === "number" ? v : Number(v ?? 0);

/* ── Server fetch helper ── */

async function serverFetch(path: string): Promise<unknown | null> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText} [${path}]`);
  }

  return res.json();
}

/* ── Data mappers ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(raw: any): Category {
  return {
    id: num(raw.id),
    slug: raw.slug ?? "",
    title: raw.title ?? raw.name ?? "",
    shortTitle: raw.short_title ?? raw.title ?? raw.name ?? "",
    rank: num(raw.rank),
    image: raw.image ?? null,
    description: raw.description ?? null,
    productCount: num(raw.product_count ?? raw.products_count ?? 0),
    metaTitle: raw.meta_title ?? null,
    metaDescription: raw.meta_description ?? null,
    children: Array.isArray(raw.children)
      ? raw.children.map(mapCategory)
      : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVariant(raw: any): Variant {
  return {
    id: num(raw.id),
    sku: raw.sku ?? "",
    name: raw.name ?? "",
    options: raw.options ?? {},
    price: num(raw.price),
    compareAtPrice:
      raw.compare_at_price != null ? num(raw.compare_at_price) : null,
    inStock: Boolean(raw.in_stock),
    lowStock: Boolean(raw.low_stock),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(raw: any): Product {
  return {
    id: num(raw.id),
    slug: raw.slug ?? "",
    sku: raw.sku ?? "",
    title: raw.title ?? raw.name ?? "",
    brand: raw.brand ?? null,
    categorySlug: raw.category_slug ?? null,
    categoryName: raw.category_name ?? null,
    price: num(raw.price),
    compareAtPrice:
      raw.compare_at_price != null ? num(raw.compare_at_price) : null,
    discountPercent: num(raw.discount_percent),
    images: Array.isArray(raw.images) ? raw.images : [],
    inStock: Boolean(raw.in_stock),
    isAvailable: Boolean(raw.is_available),
    fabric: raw.fabric ?? null,
    pieces: raw.pieces != null ? num(raw.pieces) : null,
    details: Array.isArray(raw.details) ? raw.details : [],
    shortDescription: raw.short_description ?? null,
    description: raw.description ?? null,
    variants: Array.isArray(raw.variants)
      ? raw.variants.map(mapVariant)
      : [],
    defaultVariantId:
      raw.default_variant_id != null ? num(raw.default_variant_id) : null,
    variantsCount: num(raw.variants_count ?? raw.variants?.length ?? 0),
    metaTitle: raw.meta_title ?? null,
    metaDescription: raw.meta_description ?? null,
    publishedAt: raw.published_at ?? null,
    updatedAt: raw.updated_at ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBanner(raw: any): Banner {
  return {
    id: num(raw.id),
    title: raw.title ?? "",
    subtitle: raw.subtitle ?? null,
    image: raw.image ?? "",
    mobileImage: raw.mobile_image ?? null,
    buttons: Array.isArray(raw.buttons)
      ? raw.buttons.map((b: { label?: string; href?: string }) => ({
          label: b.label ?? "",
          href: b.href ?? "",
        }))
      : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPaginationMeta(raw: any): PaginationMeta {
  return {
    currentPage: num(raw.current_page),
    lastPage: num(raw.last_page),
    perPage: num(raw.per_page),
    total: num(raw.total),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(raw: any): Review {
  return {
    id: num(raw.id),
    name: raw.name ?? "",
    title: raw.title ?? "",
    quote: raw.quote ?? raw.text ?? "",
    rating: num(raw.rating ?? 5),
    image: raw.image ?? null,
    date: raw.date ?? null,
    verified: Boolean(raw.verified ?? true),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSection(raw: any): HomeSection {
  return {
    id: num(raw.id),
    type: raw.type ?? "",
    title: raw.title ?? "",
    categories: Array.isArray(raw.categories)
      ? raw.categories.map(mapCategory)
      : undefined,
    tabs: Array.isArray(raw.tabs)
      ? raw.tabs.map(
          (t: { category?: unknown; total?: number; products?: unknown[] }) => ({
            category: mapCategory(t.category),
            total: num(t.total),
            products: Array.isArray(t.products)
              ? t.products.map(mapProduct)
              : [],
          }),
        )
      : undefined,
    category: raw.category ? mapCategory(raw.category) : raw.category === null ? null : undefined,
    products: Array.isArray(raw.products)
      ? raw.products.map(mapProduct)
      : undefined,
  };
}

/* ── Cached API functions ── */

export async function getSite(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await serverFetch("/settings")) as any;
  const d = raw?.data ?? raw;

  return {
    name: d.name ?? "",
    tagline: d.tagline ?? "",
    about: d.about ?? "",
    email: d.email ?? null,
    phone: d.phone ?? null,
    hours: d.hours ?? null,
    currencySymbol: d.currency_symbol ?? "Rs.",
    announcements: Array.isArray(d.announcements) ? d.announcements : [],
    freeShippingThreshold:
      d.free_shipping_threshold != null
        ? num(d.free_shipping_threshold)
        : null,
    shippingMethods: Array.isArray(d.shipping_methods)
      ? d.shipping_methods.map(
          (m: { code?: string; name?: string; fee?: number }) => ({
            code: m.code ?? "",
            name: m.name ?? "",
            fee: num(m.fee),
          }),
        )
      : [],
    paymentMethods: Array.isArray(d.payment_methods)
      ? d.payment_methods.map((m: { code?: string; name?: string }) => ({
          code: m.code ?? "",
          name: m.name ?? "",
        }))
      : [],
    allowGuestCheckout: Boolean(d.allow_guest_checkout),
    maxQuantityPerItem: num(d.max_quantity_per_item ?? 10),
    navigation: Array.isArray(d.navigation)
      ? d.navigation.map((n: { label?: string; href?: string }) => ({
          label: n.label ?? "",
          href: n.href ?? "",
        }))
      : [],
    trust: Array.isArray(d.trust)
      ? d.trust.map(
          (t: { icon?: string; title?: string; text?: string }) => ({
            icon: t.icon ?? "",
            title: t.title ?? "",
            text: t.text ?? "",
          }),
        )
      : [],
    footer: {
      columns: Array.isArray(d.footer?.columns)
        ? d.footer.columns.map(
            (c: {
              heading?: string;
              links?: { label?: string; href?: string }[];
            }) => ({
              heading: c.heading ?? "",
              links: Array.isArray(c.links)
                ? c.links.map((l: { label?: string; href?: string }) => ({
                    label: l.label ?? "",
                    href: l.href ?? "",
                  }))
                : [],
            }),
          )
        : [],
      copyright: d.footer?.copyright ?? "",
    },
    social: Array.isArray(d.social)
      ? d.social.map((s: { href?: string; label?: string }) => ({
          href: s.href ?? "",
          label: s.label ?? "",
        }))
      : [],
    seo: {
      defaultTitle: d.seo?.default_title ?? d.seo?.defaultTitle ?? "",
      defaultDescription:
        d.seo?.default_description ?? d.seo?.defaultDescription ?? "",
      ogImage: d.seo?.og_image ?? d.seo?.ogImage ?? null,
    },
  };
}

export async function getHome(): Promise<HomeData> {
  "use cache";
  cacheLife("minutes");
  cacheTag("home", "products");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await serverFetch("/home")) as any;
  const d = raw?.data ?? raw;

  return {
    banners: Array.isArray(d.banners) ? d.banners.map(mapBanner) : [],
    promos: Array.isArray(d.promos) ? d.promos.map(mapBanner) : [],
    sections: Array.isArray(d.sections) ? d.sections.map(mapSection) : [],
    reviews: Array.isArray(d.reviews) ? d.reviews.map(mapReview) : [],
  };
}

export async function getCollections(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await serverFetch("/categories")) as any;
  const data = raw?.data ?? raw;
  return Array.isArray(data) ? data.map(mapCategory) : [];
}

export async function getCollection(
  slug: string,
): Promise<Category | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories", `category:${slug}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await serverFetch(`/categories/${slug}`)) as any;
  if (!raw) return null;
  return mapCategory(raw.data ?? raw);
}

export async function getProducts(
  params: {
    category?: string;
    q?: string;
    sort?: string;
    page?: number;
    perPage?: number;
    minPrice?: number;
    maxPrice?: number;
    availability?: string;
    onSale?: boolean;
    fabric?: string;
    pieces?: string;
  } = {},
): Promise<{ products: Paginated<Product>; facets: Facets }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("per_page", String(params.perPage));
  if (params.minPrice != null) query.set("min_price", String(params.minPrice));
  if (params.maxPrice != null) query.set("max_price", String(params.maxPrice));
  if (params.availability) query.set("availability", params.availability);
  if (params.onSale) query.set("on_sale", "1");
  if (params.fabric) query.set("fabric", params.fabric);
  if (params.pieces) query.set("pieces", params.pieces);

  const qs = query.toString();
  const path = `/products${qs ? `?${qs}` : ""}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await serverFetch(path)) as any;

  const products: Paginated<Product> = {
    data: Array.isArray(raw.data) ? raw.data.map(mapProduct) : [],
    meta: mapPaginationMeta(raw.meta ?? raw),
  };

  const f = raw.facets ?? raw.filters ?? {};
  const facets: Facets = {
    price: {
      min: num(f.price?.min ?? 0),
      max: num(f.price?.max ?? 0),
    },
    fabrics: Array.isArray(f.fabrics) ? f.fabrics : [],
    pieces: Array.isArray(f.pieces) ? f.pieces.map(Number) : [],
  };

  return { products, facets };
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await serverFetch(`/products/${slug}`)) as any;
  if (!raw) return null;
  return mapProduct(raw.data ?? raw);
}

export async function getPage(slug: string): Promise<StaticPage | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pages");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await serverFetch(`/pages/${slug}`)) as any;
  if (!raw) return null;

  const d = raw.data ?? raw;
  return {
    title: d.title ?? "",
    sections: Array.isArray(d.sections)
      ? d.sections.map(
          (s: { heading?: string | null; body?: string }) => ({
            heading: s.heading ?? null,
            body: s.body ?? "",
          }),
        )
      : [],
  };
}
