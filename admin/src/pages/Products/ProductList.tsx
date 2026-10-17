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
          <FilterSelect label="Status" value={values.status} onChange={(v) => set("status", v)} options={STATUS} />
          <FilterSelect
            label="Category"
            value={values.category}
            onChange={(v) => set("category", v)}
            options={(categories.data ?? []).map((c) => ({ value: c.slug, label: c.name }))}
          />
          <FilterSelect label="Show" value={values.trashed} onChange={(v) => set("trashed", v)} options={[{ value: "only", label: "Deleted only" }, { value: "with", label: "Include deleted" }]} />
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" className="size-4 accent-brand-500" checked={values.low_stock === "1"} onChange={(e) => set("low_stock", e.target.checked ? "1" : "")} />
            Low stock
          </label>
        </FilterBar>

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
                    header: <span className="sr-only">Actions</span>,
                    align: "end",
                    cell: (p) =>
                      p.deleted_at ? (
                        <Button size="sm" variant="outline" onClick={() => void restore(p.id)}>
                          Restore
                        </Button>
                      ) : (
                        <Link to={`/products/${p.id}`} className="text-sm font-medium text-brand-500 hover:underline">
                          Edit
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
