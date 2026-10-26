import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCollections, getContentPages } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const [collections, products, pages] = await Promise.all([getCollections(), getAllProductSlugs(), getContentPages()]);

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/collections/all`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...collections.map((c) => ({
      url: `${base}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pages.map((p) => ({
      url: `${base}/pages/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
