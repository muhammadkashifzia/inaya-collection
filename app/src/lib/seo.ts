import type { Collection, Product, SiteConfig } from "@/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Safely serialise JSON-LD for a <script> tag (prevents `</script>` breakouts). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/* ------------------------------------------------------------------ */
/*  Organization + WebSite  (root layout — appears on every page)     */
/* ------------------------------------------------------------------ */

export function organizationJsonLd(site: SiteConfig): Record<string, unknown> {
  const base = siteUrl();
  const sameAs = site.social.map((s) => s.href).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: base,
    ...(site.logoUrl ? { logo: site.logoUrl } : {}),
    description: site.seo.defaultDescription || site.about || undefined,
    ...(site.email ? { email: `mailto:${site.email}` } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.address ? { address: { "@type": "PostalAddress", streetAddress: site.address } } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      ...(site.phone ? { telephone: site.phone } : {}),
      ...(site.email ? { email: site.email } : {}),
      ...(site.hours ? { hoursAvailable: site.hours } : {}),
    },
  };
}

export function webSiteJsonLd(site: SiteConfig): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: base,
    description: site.seo.defaultDescription || site.about || undefined,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Product                                                           */
/* ------------------------------------------------------------------ */

export function productJsonLd(product: Product, site: SiteConfig): Record<string, unknown> {
  const url = `${siteUrl()}/products/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    url,
    image: product.images,
    description: product.metaDescription ?? product.shortDescription ?? product.description ?? undefined,
    brand: { "@type": "Brand", name: product.brand ?? site.name },
    category: product.categoryName ?? undefined,
    ...(product.fabric ? { material: product.fabric } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "PKR",
      price: product.price.toFixed(2),
      ...(product.compareAtPrice ? { highPrice: product.compareAtPrice.toFixed(2) } : {}),
      availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: site.name },
    },
  };
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList                                                    */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: `${base}${item.href}` } : {}),
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  CollectionPage                                                    */
/* ------------------------------------------------------------------ */

export function collectionJsonLd(collection: { title: string; description: string | null; slug: string }, site: SiteConfig): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    url: `${base}/collections/${collection.slug}`,
    ...(collection.description ? { description: collection.description } : {}),
    isPartOf: { "@type": "WebSite", name: site.name, url: base },
  };
}

/* ------------------------------------------------------------------ */
/*  WebPage (for CMS content pages)                                   */
/* ------------------------------------------------------------------ */

export function webPageJsonLd(page: { title: string; slug: string; metaDescription?: string | null; updatedAt?: string | null }, site: SiteConfig): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    url: `${base}/pages/${page.slug}`,
    ...(page.metaDescription ? { description: page.metaDescription } : {}),
    ...(page.updatedAt ? { dateModified: page.updatedAt } : {}),
    isPartOf: { "@type": "WebSite", name: site.name, url: base },
    publisher: { "@type": "Organization", name: site.name, url: base },
  };
}
