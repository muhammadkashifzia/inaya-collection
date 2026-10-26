import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/atoms";
import { ProductGridSkeleton } from "@/components/organisms";
import { CollectionTemplate } from "@/components/templates";
import { parseCatalogParams } from "@/lib/catalog-params";
import { getCollection, getCollections, getFacets, getProducts } from "@/lib/data";
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from "@/lib/seo";

const ALL = { title: "All Products", description: "Browse every unstitched suit in our range.", metaTitle: null, metaDescription: null, image: null as string | null };

export async function generateStaticParams() {
  const collections = await getCollections();
  return [{ slug: "all" }, ...collections.map((c) => ({ slug: c.slug }))];
}

async function resolve(slug: string) {
  return slug === "all" ? ALL : getCollection(slug);
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await resolve(slug);
  if (!c) return {};
  return {
    title: c.metaTitle ?? c.title,
    description: c.metaDescription ?? c.description ?? undefined,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      type: "website",
      title: c.metaTitle ?? c.title,
      description: c.metaDescription ?? c.description ?? undefined,
      ...(c.image ? { images: [c.image] } : {}),
    },
  };
}

async function CollectionContent({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const collection = await resolve(slug);
  if (!collection) notFound();

  const { query, queryString } = parseCatalogParams(sp, slug);
  const [result, facets] = await Promise.all([getProducts(query), getFacets()]);

  const breadcrumbs = [{ name: "Home", href: "/" }, { name: collection.title }];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(breadcrumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd(collection.title, slug, result.data)) }} />
      <CollectionTemplate
        title={collection.title}
        description={collection.description}
        basePath={`/collections/${slug}`}
        query={queryString}
        result={result}
        facets={facets}
      />
    </>
  );
}

export default function CollectionPage(props: PageProps<"/collections/[slug]">) {
  return (
    <Suspense
      fallback={
        <Container className="py-10 md:py-14">
          <div className="mb-8 h-10 w-64 animate-pulse bg-cream" />
          <ProductGridSkeleton count={8} />
        </Container>
      }
    >
      <CollectionContent {...props} />
    </Suspense>
  );
}
