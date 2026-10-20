import { useState } from "react";
import { Link } from "react-router";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import FilterBar, { FilterSelect } from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import { ProductStatusBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { http } from "@/lib/api";
import { money } from "@/lib/format";
import type { Category, Paginated, Product } from "@/types/api";

const STATUS = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export default function ProductList() {
  const { values, page, set } = useListQuery(["q", "status", "category", "trashed", "low_stock"] as const);
  const categories = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const { data, error, loading, reload } = useApi(
    () =>
      http.get<Paginated<Product>>("/admin/products", {
        q: values.q,
        status: values.status,
        category: values.category,
        trashed: values.trashed,
        low_stock: values.low_stock === "1" ? true : undefined,
        page,
        per_page: 20,
      }),
    [values, page],
  );

  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = !!(values.status || values.category || values.trashed || values.low_stock);

  async function restore(id: number) {
    await http.post(`/admin/products/${id}/restore`);
    reload();
  }

  return (
    <>
      <PageMeta title="Products | Anaya Collection Admin" description="Manage products, pricing and variants." />
      <PageHeader
        title="Products"
        description="Everything listed on the storefront."
        actions={
          <Link to="/products/new" className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            + Add product
          </Link>
        }
      />
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Search name or SKU">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            }`}
          >
            <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="flex size-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {[values.status, values.category, values.trashed, values.low_stock].filter(Boolean).length}
              </span>
            )}
          </button>
        </FilterBar>

        {/* ── Collapsible filter panel ── */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-white/2">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect label="Status" value={values.status} onChange={(v) => set("status", v)} options={STATUS} />
              <FilterSelect
                label="Category"
                value={values.category}
                onChange={(v) => set("category", v)}
                options={(categories.data ?? []).map((c) => ({ value: c.slug, label: c.name }))}
              />
              <FilterSelect label="Show" value={values.trashed} onChange={(v) => set("trashed", v)} options={[{ value: "only", label: "Deleted only" }, { value: "with", label: "Include deleted" }]} />
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                <input type="checkbox" className="size-4 accent-brand-500" checked={values.low_stock === "1"} onChange={(e) => set("low_stock", e.target.checked ? "1" : "")} />
                Low stock
              </label>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { set("status", ""); set("category", ""); set("trashed", ""); set("low_stock", ""); }}
                  className="text-sm font-medium text-brand-500 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          hasData={Boolean(data)}
          empty={data?.data.length === 0}
          emptyTitle="No products match these filters."
          emptyAction={<Link to="/products/new" className="text-sm font-medium text-brand-500">Add your first product</Link>}
        >
          {data && (
            <>
              <DataTable
                caption="Products"
                rows={data.data}
                rowKey={(p) => p.id}
                columns={[
                  {
                    key: "product",
                    header: "Product",
                    cell: (p) => (
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                          {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/products/${p.id}`} className="block max-w-72 truncate font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">
                            {p.name}
                          </Link>
                          <span className="text-theme-xs text-gray-500">
                            {p.sku} {p.is_featured && <span className="ms-1 text-brand-500">★ Featured</span>}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                  { key: "category", header: "Category", cell: (p) => p.category?.name ?? "—" },
                  {
                    key: "price",
                    header: "Price",
                    cell: (p) =>
                      p.sale_price ? (
                        <span>
                          <span className="font-semibold text-brand-600">{money(p.sale_price)}</span> <s className="text-theme-xs text-gray-400">{money(p.price)}</s>
                        </span>
                      ) : (
                        money(p.price)
                      ),
                  },
                  {
                    key: "stock",
                    header: "Stock",
                    cell: (p) => (
                      <span className={p.total_stock === 0 ? "font-semibold text-error-600" : (p.total_stock ?? 0) <= p.low_stock_threshold ? "font-semibold text-warning-600" : undefined}>
                        {p.total_stock ?? "—"}
                        {(p.variants?.length ?? 0) > 1 && <span className="ms-1 text-theme-xs text-gray-400">({p.variants?.length} variants)</span>}
                      </span>
                    ),
                  },
                  { key: "sold", header: "Sold", cell: (p) => p.sales_count ?? 0 },
                  { key: "status", header: "Status", cell: (p) => (p.deleted_at ? <span className="text-theme-xs text-error-600">Deleted</span> : <ProductStatusBadge status={p.status} />) },
                  {
                    key: "actions",
                    header: "Action",
                    align: "end",
                    cell: (p) =>
                      p.deleted_at ? (
                        <Button size="sm" variant="outline" onClick={() => void restore(p.id)}>
                          Restore
                        </Button>
                      ) : (
                        <Link to={`/products/${p.id}`} title="Edit" className="inline-flex rounded-lg p-1.5 text-brand-500 transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10">
                          <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </Link>
                      ),
                  },
                ]}
              />
              <Pagination meta={data.meta} onPage={(p) => set("page", p)} />
            </>
          )}
        </DataState>
      </Card>
    </>
  );
}
