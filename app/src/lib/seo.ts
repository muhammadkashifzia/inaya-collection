import type { Product, SiteConfig } from "@/types";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * schema.org Product structured data for product pages.
 */
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
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "PKR",
      price: product.price.toFixed(2),
      availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/** Safely serialise JSON-LD for a <script> tag (prevents `</script>` breakouts). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
