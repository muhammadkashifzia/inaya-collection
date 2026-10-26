import { ButtonLink, Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import type { Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

/** Generic homepage product section (featured, best sellers, latest, discounted, category). */
export function ProductRail({ title, subtitle, products, href, category, center = true }: { title: string; subtitle?: string; products: Product[]; href?: string; category?: string; center?: boolean }) {
  if (!products.length) return null;
  return (
    <section className="py-6 md:py-10">
      <Container>
        <SectionHeader title={title} subtitle={subtitle} center={center} />
        <ProductGrid products={products} />
        {href && (
          <div className="mt-6 flex justify-center md:mt-8">
            <ButtonLink href={href} variant="outline" size="sm">
              {category || "View all"}
            </ButtonLink>
          </div>
        )}
      </Container>
    </section>
  );
}
