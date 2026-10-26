import type { Metadata } from "next";
import { HomeTemplate } from "@/components/templates";
import { getHome, getSite } from "@/lib/data";
import { jsonLdString, organizationJsonLd, siteUrl, webSiteJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const title = site.seo.defaultTitle || `${site.name} | ${site.tagline}`;
  const description = site.seo.defaultDescription || site.about;
  return {
    title,
    description,
    alternates: { canonical: siteUrl() },
    openGraph: {
      type: "website",
      title,
      description,
      url: siteUrl(),
      ...(site.seo.ogImage ? { images: [{ url: site.seo.ogImage, width: 1200, height: 630, alt: site.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(site.seo.ogImage ? { images: [site.seo.ogImage] } : {}),
    },
  };
}

export default async function HomePage() {
  const [home, site] = await Promise.all([getHome(), getSite()]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(organizationJsonLd(site)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(webSiteJsonLd(site)) }} />
      <HomeTemplate home={home} />
    </>
  );
}
