import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { ContactPageTemplate, ContentPageTemplate } from "@/components/templates";
import { getContentPage, getContentPages, getSite } from "@/lib/data";
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
  const page = await getContentPage(slug);
  if (!page) notFound();

  if (slug === "contact-us") {
    const site = await getSite();
    return (
      <ContactPageTemplate page={page} site={site}>
        <ContactForm />
      </ContactPageTemplate>
    );
  }

  return <ContentPageTemplate page={page}>{slug === "track-your-order" && <TrackOrderForm />}</ContentPageTemplate>;
}

export default function ContentPage({ params }: PageProps<"/pages/[slug]">) {
  return (
    <Suspense fallback={<Container className="max-w-3xl py-16"><div className="mx-auto h-10 w-64 animate-pulse bg-cream" /></Container>}>
      <PageContent params={params} />
    </Suspense>
  );
}
