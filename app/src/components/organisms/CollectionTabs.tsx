"use client";

import { useState, useTransition } from "react";
import { Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import { api } from "@/lib/api";
import type { Collection, Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

interface CollectionTabsProps {
  title: string;
  tabs: { category: Collection; total: number; products: Product[] }[];
}

/**
 * Featured products section — combines products from all collections
 * into a single grid without tabs. Products are deduplicated by id.
 */
export function CollectionTabs({ title, tabs }: CollectionTabsProps) {
  // Merge all tab products into one list, deduplicated by id
  const seen = new Set<number>();
  const initialProducts: Product[] = [];
  for (const tab of tabs) {
    for (const p of tab.products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        initialProducts.push(p);
      }
    }
  }

  const [extraProducts, setExtraProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedAll, setLoadedAll] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allProducts = [...initialProducts, ...extraProducts];
  const totalProducts = tabs.reduce((sum, t) => sum + t.total, 0);
  const hasMore = !loadedAll && totalProducts > allProducts.length;

  function loadMore() {
    const nextPage = currentPage + 1;
    startTransition(async () => {
      try {
        const result = await api.products({
          page: nextPage,
          perPage: 8,
          sort: "featured",
        });

        const existingIds = new Set(allProducts.map((p) => p.id));
        const newProducts = result.data.filter((p) => !existingIds.has(p.id));

        setExtraProducts((prev) => [...prev, ...newProducts]);
        setCurrentPage(nextPage);

        if (nextPage >= result.meta.lastPage || newProducts.length === 0) {
          setLoadedAll(true);
        }
      } catch {
        // silently handled
      }
    });
  }

  if (!allProducts.length) return null;

  return (
    <section className="py-8 md:py-10">
      <Container>
        <SectionHeader title={title} />
        <ProductGrid products={allProducts} emptyText="New designs are coming soon." />

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={isPending}
              className="inline-flex items-center gap-2 border border-[#111] bg-transparent px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#111] transition-colors hover:bg-[#111] hover:text-white disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />
                  Loading...
                </>
              ) : (
                "View More"
              )}
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
