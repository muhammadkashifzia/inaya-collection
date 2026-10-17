import Link from "next/link";
import { Container, Heading } from "@/components/atoms";
import { Pagination } from "@/components/molecules";
import { CatalogToolbar, ProductGrid } from "@/components/organisms";
import type { Facets, Paginated, Product } from "@/types";

interface CollectionTemplateProps {
  title: string;
  description?: string | null;
  basePath: string;
  query: string;
  result: Paginated<Product>;
  facets: Facets;
}

export function CollectionTemplate({ title, description, basePath, query, result, facets }: CollectionTemplateProps) {
  const hrefFor = (page: number) => {
    const params = new URLSearchParams(query);
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    return `${basePath}${params.size ? `?${params}` : ""}`;
  };

  return (
    <Container className="py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link> / <span aria-current="page">{title}</span>
      </nav>
      <Heading level={1} className="mb-2">{title}</Heading>
      {description && <p className="mb-8 max-w-2xl text-sm text-muted">{description}</p>}
      <CatalogToolbar total={result.meta.total} facets={facets} />
      <ProductGrid products={result.data} emptyText="No products match these filters." />
      <Pagination meta={result.meta} hrefFor={hrefFor} />
    </Container>
  );
}
