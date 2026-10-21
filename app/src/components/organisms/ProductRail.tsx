import { ButtonLink, Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import type { Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

/** Generic homepage product section (featured, best sellers, latest, discounted, category). */
export function ProductRail({ title, products, href }: { title: string; products: Product[]; href?: string }) {
  if (!products.length) return null;
  return (
    <section className="py-14 md:py-10">
      <Container>
        <SectionHeader title={title} />
        <ProductGrid products={products} />
        {href && (
          <div className="mt-10 flex justify-center">
            <ButtonLink href={href} variant="outline">
              View all
            </ButtonLink>
          </div>
        )}
      </Container>
    </section>
  );
}
