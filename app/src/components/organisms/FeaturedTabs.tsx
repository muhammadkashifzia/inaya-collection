import { Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import type { Collection, Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

interface FeaturedTabsProps {
  title: string;
  description?: string;
  tabs: { category: Collection; total: number; products: Product[] }[];
}

/**
 * Featured products section — merges products from all collections
 * into a single grid. No category tabs.
 */
export function FeaturedTabs({ title, description, tabs }: FeaturedTabsProps) {
  if (!tabs.length) return null;

  // Merge all tab products into one list, deduplicated by id
  const seen = new Set<number>();
  const allProducts: Product[] = [];
  for (const tab of tabs) {
    for (const p of tab.products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        allProducts.push(p);
      }
    }
  }

  if (!allProducts.length) return null;

  return (
    <section className="py-8 md:py-10">
      <Container>
        <div className="mb-8 md:mb-10">
          <SectionHeader title={title} />
          {description && (
            <p className="mt-2 text-center text-[15px] leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>

        <ProductGrid
          products={allProducts}
          emptyText="New designs are coming soon."
        />
      </Container>
    </section>
  );
}
