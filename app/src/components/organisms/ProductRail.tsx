import { ButtonLink, Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import type { Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

/** Generic homepage product section (featured, best sellers, latest, discounted, category). */
export function ProductRail({ title, products, href, category }: { title: string; products: Product[]; href?: string; category?: string }) {
  if (!products.length) return null;
  return (
    <section className="py-6 sm:py-8 md:py-10">
      <Container>
        <SectionHeader
          title={title}
          action={
            href ? (
              <ButtonLink href={href} variant="outline" size="sm">
                {category || "View all"}
              </ButtonLink>
            ) : undefined
          }
        />
        <ProductGrid products={products} />
      </Container>
    </section>
  );
}
