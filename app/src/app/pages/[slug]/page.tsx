import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { ContactPageTemplate, ContentPageTemplate } from "@/components/templates";
import { getContentPage, getContentPages, getSite } from "@/lib/data";
import { faqJsonLd, jsonLdString } from "@/lib/seo";
import { ContactForm } from "./ContactForm";
import { TrackOrderForm } from "./TrackOrderForm";

export async function generateStaticParams() {
  return (await getContentPages()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getContentPage(slug);
  if (!page) return {};
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `/pages/${slug}` },
    openGraph: {
      type: "article",
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
    },
  };
}

async function PageContent({ params }: Pick<PageProps<"/pages/[slug]">, "params">) {
  const { slug } = await params;
  const page = await getContentPage(slug);
  if (!page) notFound();

  const faqSchema = faqJsonLd(page);

  if (slug === "contact-us") {
    const site = await getSite();
    return (
      <>
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }} />}
        <ContactPageTemplate page={page} site={site}>
          <ContactForm />
        </ContactPageTemplate>
      </>
    );
  }

  return (
    <>
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }} />}
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
