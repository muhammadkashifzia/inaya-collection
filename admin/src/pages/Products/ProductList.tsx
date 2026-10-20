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
import { useModal } from "@/hooks/useModal";
import { http } from "@/lib/api";
import type { Category, Paginated, Product } from "@/types/api";
import ProductExportModal from "./ProductExportModal";
import ProductImportModal from "./ProductImportModal";

const STATUS = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

/** Product type shown in the list, derived from pieces + fabric (e.g. "3 Piece · Khaddar"). */
function productType(p: Product): string {
  const parts = [p.pieces ? `${p.pieces} Piece` : null, p.fabric].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function inventory(p: Product) {
  const stock = p.total_stock;
  if (stock === undefined) return "—";
  const variants = p.variants?.length ?? 0;
  const tone = stock === 0 ? "text-error-600" : stock <= p.low_stock_threshold ? "text-warning-600" : "text-gray-700 dark:text-gray-300";
  return (
    <span className={tone}>
      {stock} in stock
      {variants > 1 && <span className="text-gray-500 dark:text-gray-400"> for {variants} variants</span>}
    </span>
  );
}

export default function ProductList() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const importModal = useModal();
  const exportModal = useModal();
  const { values, page, set } = useListQuery(["q", "status", "category", "trashed", "low_stock"] as const);
  const categories = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const filters = {
    q: values.q,
    status: values.status,
    category: values.category,
    trashed: values.trashed,
    low_stock: values.low_stock === "1" ? true : undefined,
  };
  const { data, error, loading, reload } = useApi(
    () => http.get<Paginated<Product>>("/admin/products", { ...filters, page, per_page: 20 }),
    [values, page],
  );

  async function restore(id: number) {
    await http.post(`/admin/products/${id}/restore`);
    reload();
  }

  const rows = data?.data ?? [];
  const selectable = rows.filter((p) => !p.deleted_at);
  // Only count ids that are on the current page, so stale picks from other pages/filters are ignored.
  const selectedIds = selectable.filter((p) => selected.has(p.id)).map((p) => p.id);
  const allSelected = selectable.length > 0 && selectedIds.length === selectable.length;

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectable.map((p) => p.id)));
  }

  async function deleteSelected() {
    if (!window.confirm(`Delete ${selectedIds.length} product(s)? They can be restored later from "Deleted only".`)) return;
    setDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => http.delete(`/admin/products/${id}`)));
    } finally {
      setDeleting(false);
      setSelected(new Set());
      reload();
    }
  }

  return (
    <>
      <PageMeta title="Products | Anaya Collection Admin" description="Manage products, pricing and variants." />
      <PageHeader
        title="Products"
        description="Everything listed on the storefront."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={importModal.openModal}>
              Import
            </Button>
            <Button size="sm" variant="outline" onClick={exportModal.openModal}>
              Export
            </Button>
            <Link to="/products/new" className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
              + Add product
            </Link>
          </>
        }
      />
      <ProductImportModal isOpen={importModal.isOpen} onClose={importModal.closeModal} onImported={reload} />
      {exportModal.isOpen && (
        <ProductExportModal
          isOpen
          onClose={exportModal.closeModal}
          pageIds={rows.map((p) => p.id)}
          selectedIds={selectedIds}
          filters={filters}
          hasFilters={Object.values(filters).some((v) => v !== undefined && v !== "")}
        />
      )}
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
              {selectedIds.length > 0 && (
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm dark:border-gray-800 dark:bg-white/3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{selectedIds.length} selected</span>
                  <Button size="sm" variant="outline" disabled={deleting} onClick={() => void deleteSelected()}>
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                  <button type="button" className="ms-auto text-gray-500 hover:text-gray-700 dark:text-gray-400" onClick={() => setSelected(new Set())}>
                    Clear
                  </button>
                </div>
              )}
              <DataTable
                caption="Products"
                rows={data.data}
                rowKey={(p) => p.id}
                columns={[
                  {
                    key: "select",
                    className: "w-10",
                    header: <input type="checkbox" aria-label="Select all products" className="size-4 accent-brand-500" checked={allSelected} onChange={toggleAll} disabled={selectable.length === 0} />,
                    cell: (p) => (
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        className="size-4 accent-brand-500"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                        disabled={Boolean(p.deleted_at)}
                      />
                    ),
                  },
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
                  { key: "status", header: "Status", cell: (p) => (p.deleted_at ? <span className="text-theme-xs text-error-600">Deleted</span> : <ProductStatusBadge status={p.status} />) },
                  { key: "inventory", header: "Inventory", className: "whitespace-nowrap", cell: inventory },
                  { key: "category", header: "Category", cell: (p) => p.category?.name ?? "—" },
                  { key: "type", header: "Product type", className: "whitespace-nowrap", cell: productType },
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
