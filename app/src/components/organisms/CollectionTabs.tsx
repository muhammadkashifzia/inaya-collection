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
    <div role="tablist" className="flex items-center gap-4 md:gap-6 md:flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.category.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.category.id}
          onClick={() => setActiveTab(tab.category.id)}
          className={`shrink-0 pb-1 text-[13px] md:text-[14px] tracking-wide transition-colors ${
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
    <section className="py-6 md:py-10">
      <Container>
        <SectionHeader title={title} subtitle={subtitle ?? undefined} action={categoryTabs} center={false} />
        <ProductGrid products={displayProducts} emptyText="New designs are coming soon." />

        {hasMore && (
          <div className="mt-6 flex justify-center md:mt-8">
            <button
              type="button"
              onClick={loadMore}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 border border-ink bg-transparent px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
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
