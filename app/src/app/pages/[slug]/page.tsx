import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { ContactPageTemplate, ContentPageTemplate } from "@/components/templates";
import { getContentPage, getContentPages, getSite } from "@/lib/data";
import { breadcrumbJsonLd, jsonLdString, webPageJsonLd } from "@/lib/seo";
import { ContactForm } from "./ContactForm";
import { TrackOrderForm } from "./TrackOrderForm";

export async function generateStaticParams() {
  return (await getContentPages()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getContentPage(slug);
  return page
    ? { title: page.metaTitle ?? page.title, description: page.metaDescription ?? undefined, alternates: { canonical: `/pages/${slug}` } }
    : {};
}

async function PageContent({ params }: Pick<PageProps<"/pages/[slug]">, "params">) {
  const { slug } = await params;
  const [page, site] = await Promise.all([getContentPage(slug), getSite()]);
  if (!page) notFound();

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: page.title },
  ];

  const jsonLd = (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(webPageJsonLd(page, site)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(breadcrumbs)) }} />
    </>
  );

  if (slug === "contact-us") {
    return (
      <>
        {jsonLd}
        <ContactPageTemplate page={page} site={site}>
          <ContactForm />
        </ContactPageTemplate>
      </>
    );
  }

  return (
    <>
      {jsonLd}
      <ContentPageTemplate page={page}>{slug === "track-your-order" && <TrackOrderForm />}</ContentPageTemplate>
    </>
  );
}

export default function ContentPage({ params }: PageProps<"/pages/[slug]">) {
  return (
    <Suspense fallback={<Container className="max-w-3xl py-16"><div className="mx-auto h-10 w-64 animate-pulse bg-cream" /></Container>}>
      <PageContent params={params} />
    </Suspense>
  );
}
