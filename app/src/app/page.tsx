import type { Metadata } from "next";
import { HomeTemplate } from "@/components/templates";
import { getHome, getSite } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const base = siteUrl();
  return {
    title: site.seo.defaultTitle || `${site.name} — ${site.tagline}`,
    description: site.seo.defaultDescription || site.about,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title: site.seo.defaultTitle || `${site.name} — ${site.tagline}`,
      description: site.seo.defaultDescription || site.about,
      url: base,
      siteName: site.name,
      images: site.seo.ogImage ? [site.seo.ogImage] : undefined,
    },
  };
}

export default async function HomePage() {
  const home = await getHome();
  return <HomeTemplate home={home} />;
}
