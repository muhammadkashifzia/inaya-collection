import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { ProductTemplate } from "@/components/templates";
import { getAllProductSlugs, getProduct, getSite } from "@/lib/data";
import { jsonLdString, productJsonLd } from "@/lib/seo";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProduct(slug);
  if (!result) return {};
  const { product } = result;
  return {
    title: product.metaTitle ?? product.title,
    description: product.metaDescription ?? product.shortDescription ?? product.description ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { type: "website", title: product.title, images: product.images.slice(0, 1) },
  };
}

async function ProductContent({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const [result, site] = await Promise.all([getProduct(slug), getSite()]);
  if (!result) notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(result.product, site)) }} />
      <ProductTemplate product={result.product} related={result.related} maxQuantity={site.maxQuantityPerItem} />
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense
      fallback={
        <Container className="grid gap-8 py-12 lg:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse bg-cream" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse bg-cream" />
            <div className="h-6 w-1/3 animate-pulse bg-cream" />
            <div className="h-12 animate-pulse bg-cream" />
          </div>
        </Container>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}
