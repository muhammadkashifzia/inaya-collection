"use client";

import { useState, useTransition } from "react";
import { Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import { api } from "@/lib/api";
import type { Collection, Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

interface CollectionTabsProps {
  title: string;
  subtitle?: string | null;
  tabs: { category: Collection; total: number; products: Product[] }[];
}

/**
 * Collection products section with category tabs on the right side of the heading.
 * "All" tab shows merged products; individual tabs filter by category with load-more.
 */
export function CollectionTabs({ title, subtitle, tabs }: CollectionTabsProps) {
  const [activeTab, setActiveTab] = useState<number>(tabs[0].category.id);

  // Merge all tab products for the "All" view
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

  const allMergedProducts = [...initialProducts, ...extraProducts];
  const totalProducts = tabs.reduce((sum, t) => sum + t.total, 0);
  const hasMore = !loadedAll && totalProducts > allMergedProducts.length;

  const displayProducts = tabs.find((t) => t.category.id === activeTab)?.products ?? allMergedProducts;

  function loadMore() {
    const nextPage = currentPage + 1;
    startTransition(async () => {
      try {
        const result = await api.products({
          page: nextPage,
          perPage: 8,
          sort: "featured",
        });

        const existingIds = new Set(allMergedProducts.map((p) => p.id));
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

  if (!initialProducts.length) return null;

  const categoryTabs = (
    <div role="tablist" className="no-scrollbar -mx-4 flex items-center gap-4 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:gap-6 sm:overflow-visible sm:px-0">
      {tabs.map((tab) => (
        <button
          key={tab.category.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.category.id}
          onClick={() => setActiveTab(tab.category.id)}
          className={`shrink-0 whitespace-nowrap pb-1 text-[13px] tracking-wide transition-colors sm:text-[14px] ${
            activeTab === tab.category.id
              ? "border-b-2 border-ink font-semibold text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.category.shortTitle || tab.category.title}
        </button>
      ))}
    </div>
  );

  return (
    <section className="py-6 sm:py-8 md:py-10">
      <Container>
        <SectionHeader title={title} subtitle={subtitle ?? undefined} action={categoryTabs} />
        <ProductGrid products={displayProducts} emptyText="New designs are coming soon." />

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
