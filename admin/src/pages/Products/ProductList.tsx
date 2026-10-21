import { useRef, useState } from "react";
import { Link } from "react-router";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import FilterBar, { FilterSelect } from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import { ProductStatusBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { useModal } from "@/hooks/useModal";
import { API_URL, http } from "@/lib/api";
import { money } from "@/lib/format";
import { DownloadIcon, EyeIcon, PencilIcon, TrashBinIcon, UploadIcon } from "@/icons";
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
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const hasActiveFilters = !!(values.status || values.category || values.trashed || values.low_stock);

  const currentIds = (data?.data ?? []).filter((p) => !p.deleted_at).map((p) => p.id);
  const allSelected = currentIds.length > 0 && currentIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(currentIds));
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await http.post("/admin/products/bulk-delete", { ids: [...selected] });
      setSelected(new Set());
      setConfirmBulk(false);
      reload();
    } catch {
      // handled silently
    } finally {
      setBulkDeleting(false);
    }
  }

  // Import modal state
  const importModal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    message: string;
    created: number;
    updated: number;
    skipped: number;
    image_rows: number;
    errors: string[];
  } | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      await http.ensureCsrf();
      const xsrf = document.cookie
        .split("; ")
        .find((c) => c.startsWith("XSRF-TOKEN="));
      const token = xsrf ? decodeURIComponent(xsrf.split("=").slice(1).join("=")) : "";

      const params = new URLSearchParams();
      if (values.status) params.set("status", values.status);
      if (values.category) params.set("category", values.category);
      if (values.q) params.set("q", values.q);
      const qs = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`${API_URL}/api/v1/admin/products/export${qs}`, {
        credentials: "include",
        headers: { "X-XSRF-TOKEN": token, Accept: "text/csv" },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently handled
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", importFile);
      const result = await http.post<{
        message: string;
        created: number;
        updated: number;
        skipped: number;
        image_rows: number;
        errors: string[];
      }>("/admin/products/import", form);
      setImportResult(result);
      reload();
    } catch (err) {
      setImportResult({
        message: err instanceof Error ? err.message : "Import failed.",
        created: 0,
        updated: 0,
        skipped: 0,
        image_rows: 0,
        errors: [],
      });
    } finally {
      setImporting(false);
    }
  }

  function closeImportModal() {
    importModal.closeModal();
    setImportFile(null);
    setImportResult(null);
  }

  async function restore(id: number) {
    await http.post(`/admin/products/${id}/restore`);
    reload();
  }

  async function onConfirmDelete() {
    if (!confirmProduct) return;
    try {
      await http.delete(`/admin/products/${confirmProduct.id}`);
      reload();
    } catch {
      // handled silently
    } finally {
      setConfirmProduct(null);
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
            <Button variant="outline" size="sm" startIcon={<DownloadIcon className="size-4" />} onClick={() => void handleExport()} loading={exporting}>
              Export
            </Button>
            <Button variant="outline" size="sm" startIcon={<UploadIcon className="size-4" />} onClick={importModal.openModal}>
              Import
            </Button>
            <Link to="/products/new" className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
              + Add product
            </Link>
          </>
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
              {/* ── Bulk action bar ── */}
              {someSelected && (
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10">
                  <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                    {selected.size} selected
                  </span>
                  <Button size="sm" variant="danger" startIcon={<TrashBinIcon className="size-3.5" />} onClick={() => setConfirmBulk(true)}>
                    Delete selected
                  </Button>
                  <button type="button" onClick={() => setSelected(new Set())} className="ms-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    Clear selection
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
                    header: (
                      <input
                        type="checkbox"
                        className="size-4 rounded accent-brand-500"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all products"
                      />
                    ),
                    className: "w-10",
                    cell: (p) =>
                      p.deleted_at ? null : (
                        <input
                          type="checkbox"
                          className="size-4 rounded accent-brand-500"
                          checked={selected.has(p.id)}
                          onChange={() => toggleOne(p.id)}
                          aria-label={`Select ${p.name}`}
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
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/products/${p.id}`} title="View" className="inline-flex rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-brand-400">
                            <EyeIcon className="size-[18px]" />
                          </Link>
                          <Link to={`/products/${p.id}`} title="Edit" className="inline-flex rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-brand-400">
                            <PencilIcon className="size-[18px]" />
                          </Link>
                          <button type="button" onClick={() => setConfirmProduct(p)} title="Delete" className="inline-flex rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400">
                            <TrashBinIcon className="size-[18px]" />
                          </button>
                        </div>
                      ),
                  },
                ]}
              />
              <Pagination meta={data.meta} onPage={(p) => set("page", p)} />
            </>
          )}
        </DataState>
      </Card>

      <ConfirmDialog
        open={confirmProduct !== null}
        title={`Delete "${confirmProduct?.name}"?`}
        message="It will be hidden from the store. Order history is kept. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => setConfirmProduct(null)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title={`Delete ${selected.size} products?`}
        message="Selected products will be archived and hidden from the store. Order history is kept."
        confirmLabel={bulkDeleting ? "Deleting..." : "Delete all"}
        onConfirm={() => void bulkDelete()}
        onCancel={() => setConfirmBulk(false)}
      />

      {/* ── Import Modal ── */}
      <Modal isOpen={importModal.isOpen} onClose={closeImportModal} className="max-w-lg p-6 sm:p-8">
        <h3 className="mb-1 text-lg font-semibold text-ink-900 dark:text-white">Import products</h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Upload a CSV file to create or update products in bulk. Products are matched by Handle (slug) or SKU.
        </p>

        {!importResult ? (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-brand-400"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-brand-400"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-brand-400");
                const file = e.dataTransfer.files[0];
                if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) setImportFile(file);
              }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition-colors hover:border-brand-400 dark:border-gray-600 dark:hover:border-brand-400"
            >
              <UploadIcon className="size-8 text-gray-400" />
              {importFile ? (
                <p className="text-sm font-medium text-ink-900 dark:text-white">{importFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag &amp; drop a CSV file here, or <span className="font-medium text-brand-500">browse</span>
                </p>
              )}
              <p className="text-theme-xs text-gray-400">CSV files only, up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) setImportFile(e.target.files[0]); }}
            />

            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">CSV format</p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Use the <button type="button" onClick={() => void handleExport()} className="font-medium text-brand-500 hover:underline">Export</button> to get a template with the correct columns. Required column: <strong>Title</strong>.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={closeImportModal}>Cancel</Button>
              <Button size="sm" onClick={() => void handleImport()} disabled={!importFile} loading={importing}>
                Upload &amp; import
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/5">
              <p className="mb-3 text-sm font-medium text-ink-900 dark:text-white">{importResult.message}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-success-600 dark:text-success-400">{importResult.created} created</span>
                <span className="text-brand-600 dark:text-brand-400">{importResult.updated} updated</span>
                {importResult.skipped > 0 && <span className="text-warning-600 dark:text-warning-400">{importResult.skipped} skipped</span>}
                {importResult.image_rows > 0 && <span className="text-gray-500 dark:text-gray-400">{importResult.image_rows} image rows</span>}
              </div>
              {importResult.errors.length > 0 && (
                <ul className="mt-3 max-h-32 list-disc overflow-y-auto ps-5 text-theme-xs text-error-600 dark:text-error-400">
                  {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={closeImportModal}>Done</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
