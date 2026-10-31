import Link from "next/link";
import { Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import { ProductDetail, ProductGrid, ProductReviews } from "@/components/organisms";
import type { Product } from "@/types";

interface ProductTemplateProps {
  product: Product;
  related: Product[];
  maxQuantity: number;
}

export function ProductTemplate({ product, related, maxQuantity }: ProductTemplateProps) {
  return (
    <Container className="py-6 sm:py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11px] text-muted sm:mb-6 sm:text-xs">
        <Link href="/" className="hover:text-ink">Home</Link>
        {product.categorySlug && (
          <>
            {" / "}
            <Link href={`/collections/${product.categorySlug}`} className="hover:text-ink">{product.categoryName}</Link>
          </>
        )}
        {" / "}
        <span aria-current="page">{product.title}</span>
      </nav>
      <ProductDetail product={product} maxQuantity={maxQuantity} />
      <ProductReviews slug={product.slug} />
      {related.length > 0 && (
        <section className="mt-12 sm:mt-16 md:mt-20">
          <SectionHeader title="You may also like" />
          <ProductGrid products={related} />
        </section>
      )}
    </Container>
  );
}
