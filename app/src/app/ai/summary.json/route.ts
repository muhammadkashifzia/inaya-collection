import { NextResponse } from "next/server";
import { getCollections, getSite } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const [site, collections] = await Promise.all([getSite(), getCollections()]);
  const base = siteUrl();

  return NextResponse.json(
    {
      name: site.name,
      tagline: site.tagline,
      description: site.seo.defaultDescription || site.about,
      url: base,
      language: "en",
      currency: "PKR",
      type: "ecommerce",
      categories: collections.map((c) => ({
        name: c.title,
        url: `${base}/collections/${c.slug}`,
        productCount: c.productCount,
        description: c.description,
      })),
      contact: {
        ...(site.email ? { email: site.email } : {}),
        ...(site.phone ? { phone: site.phone } : {}),
        ...(site.whatsapp ? { whatsapp: site.whatsapp } : {}),
        ...(site.address ? { address: site.address } : {}),
      },
      social: site.social.map((s) => ({ label: s.label, url: s.href })),
      sitemap: `${base}/sitemap.xml`,
    },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
