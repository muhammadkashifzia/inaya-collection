import type { ContentPage, Product, SiteConfig } from "@/types";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// Organization JSON-LD — Google Knowledge Panel
// ---------------------------------------------------------------------------

export function organizationJsonLd(site: SiteConfig): Record<string, unknown> {
  const url = siteUrl();
  const contactPoints: Record<string, unknown>[] = [];
  if (site.phone) {
    contactPoints.push({
      "@type": "ContactPoint",
      telephone: site.phone,
      contactType: "customer service",
      availableLanguage: ["English", "Urdu"],
    });
  }
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url,
    ...(site.logoUrl ? { logo: site.logoUrl } : {}),
    ...(site.email ? { email: `mailto:${site.email}` } : {}),
    ...(site.about ? { description: site.about } : {}),
    ...(site.social.length > 0 ? { sameAs: site.social.map((s) => s.href) } : {}),
    ...(contactPoints.length > 0 ? { contactPoint: contactPoints } : {}),
  };
}

// ---------------------------------------------------------------------------
// WebSite + SearchAction JSON-LD — Sitelinks Searchbox
// ---------------------------------------------------------------------------

export function webSiteJsonLd(site: SiteConfig): Record<string, unknown> {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList JSON-LD — Rich breadcrumbs in search results
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: `${siteUrl()}${item.href}` } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// CollectionPage / ItemList JSON-LD — Category pages
// ---------------------------------------------------------------------------

export function collectionJsonLd(
  title: string,
  slug: string,
  products: Product[],
): Record<string, unknown> {
  const url = `${siteUrl()}/collections/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 12).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteUrl()}/products/${p.slug}`,
        name: p.title,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Product JSON-LD — schema.org/Product with Offer + AggregateRating
// ---------------------------------------------------------------------------

export function productJsonLd(
  product: Product,
  site: SiteConfig,
  reviewSummary?: { average: number | null; count: number },
): Record<string, unknown> {
  const url = `${siteUrl()}/products/${product.slug}`;

  // Use AggregateOffer when there are multiple variant prices
  const variantPrices = product.variants.map((v) => v.price).filter((p) => p > 0);
  const uniquePrices = [...new Set(variantPrices)];
  const hasMultiplePrices = uniquePrices.length > 1;

  const offers = hasMultiplePrices
    ? {
        "@type": "AggregateOffer",
        url,
        priceCurrency: "PKR",
        lowPrice: Math.min(...uniquePrices).toFixed(2),
        highPrice: Math.max(...uniquePrices).toFixed(2),
        offerCount: product.variants.length,
        availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      }
    : {
        "@type": "Offer",
        url,
        priceCurrency: "PKR",
        price: product.price.toFixed(2),
        availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      };

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
    offers,
    // AggregateRating — only include when there are actual reviews
    ...(reviewSummary && reviewSummary.count > 0 && reviewSummary.average
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.average.toFixed(1),
            reviewCount: reviewSummary.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// FAQ JSON-LD — Content pages with heading+body pairs
// ---------------------------------------------------------------------------

export function faqJsonLd(page: ContentPage): Record<string, unknown> | null {
  // Only generate FAQ schema when there are multiple sections with headings
  // (resembling Q&A structure)
  const qaPairs = page.sections.filter((s) => s.heading && s.body);
  if (qaPairs.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qaPairs.map((s) => ({
      "@type": "Question",
      name: s.heading,
      acceptedAnswer: {
        "@type": "Answer",
        text: s.body,
      },
    })),
  };
}

/** Safely serialise JSON-LD for a <script> tag (prevents `</script>` breakouts). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
