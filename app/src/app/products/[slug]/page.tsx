import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { ProductTemplate } from "@/components/templates";
import { getAllProductSlugs, getProduct, getReviewSummary, getSite } from "@/lib/data";
import { breadcrumbJsonLd, jsonLdString, productJsonLd } from "@/lib/seo";

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
    openGraph: { type: "article", title: product.title, images: product.images.slice(0, 1) },
  };
}

async function ProductContent({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const [result, site, reviewSummary] = await Promise.all([getProduct(slug), getSite(), getReviewSummary(slug)]);
  if (!result) notFound();

  const { product } = result;
  const breadcrumbs = [
    { name: "Home", href: "/" },
    ...(product.categorySlug
      ? [{ name: product.categoryName!, href: `/collections/${product.categorySlug}` }]
      : []),
    { name: product.title },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(product, site, reviewSummary)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(breadcrumbs)) }} />
      <ProductTemplate product={product} related={result.related} maxQuantity={site.maxQuantityPerItem} />
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
