import { Container, ButtonLink } from "@/components/atoms";
import { SectionTitle } from "./SectionTitle";
import { ProductGrid } from "./ProductGrid";
import type { Product } from "@/lib/types";

interface CategoryRowProps {
  title: string;
  products: Product[];
  href?: string;
}

export function CategoryRow({ title, products, href }: CategoryRowProps) {
  return (
    <section>
      <Container>
        <SectionTitle
          title={title}
          action={
            href ? (
              <ButtonLink href={href} variant="outline" size="sm">
                View All
              </ButtonLink>
            ) : undefined
          }
        />
        <ProductGrid products={products} />
      </Container>
    </section>
  );
}
