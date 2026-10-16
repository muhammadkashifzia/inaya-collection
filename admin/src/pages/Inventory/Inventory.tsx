import { useState } from "react";
import { Link } from "react-router";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice, SelectInput, TextInput } from "@/components/admin/Fields";
import FilterBar from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { ApiError, http } from "@/lib/api";
import type { InventoryMovement, InventoryRow, Paginated } from "@/types/api";

const REASONS = [
  { value: "restock", label: "Restock (new stock received)" },
  { value: "correction", label: "Correction (stock count)" },
  { value: "damaged", label: "Damaged / lost" },
  { value: "return", label: "Customer return" },
];

export default function Inventory() {
  const { values, page, set } = useListQuery(["q", "low_stock"] as const);
  const { data, error, loading, reload } = useApi(
    () => http.get<Paginated<InventoryRow>>("/admin/inventory", { q: values.q, low_stock: values.low_stock === "1" ? true : undefined, page, per_page: 25 }),
    [values, page],
  );
  const [target, setTarget] = useState<InventoryRow | null>(null);
  const [form, setForm] = useState({ direction: "add", quantity: "", reason: "restock", note: "" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function adjust(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const qty = Math.abs(Number(form.quantity));
    setBusy(true);
    setFormError(null);
    try {
      const movement = await http.post<InventoryMovement>(`/admin/inventory/${target.id}/adjust`, {
        quantity_change: form.direction === "add" ? qty : -qty,
        reason: form.reason,
        note: form.note || null,
      });
      setNotice(`${target.sku}: stock is now ${movement.stock_after}.`);
      setTarget(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not adjust stock.", 0));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageMeta title="Inventory | Inaya Collection Admin" description="Stock levels by variant." />
      <PageHeader
        title="Inventory"
        description="Stock per variant. Every change is recorded with a reason and the staff member."
        actions={<Link to="/inventory/movements" className="text-sm font-medium text-brand-500 hover:underline">Stock history →</Link>}
      />
      <div className="mb-4"><Notice tone="success">{notice}</Notice></div>
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Product name or SKU">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" className="size-4 accent-brand-500" checked={values.low_stock === "1"} onChange={(e) => set("low_stock", e.target.checked ? "1" : "")} />
            Low stock only
          </label>
        </FilterBar>
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.data.length === 0} emptyTitle="No variants match.">
          {data && (
            <>
              <DataTable
                caption="Inventory"
                rows={data.data}
                rowKey={(r) => r.id}
                columns={[
                  {
                    key: "product",
                    header: "Product",
                    cell: (r) => (
                      <div>
                        <Link to={`/products/${r.product_id}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{r.product_name}</Link>
                        <p className="text-theme-xs text-gray-500">{r.name !== "Default" ? r.name : "Default variant"}</p>
                      </div>
                    ),
                  },
                  { key: "sku", header: "SKU", cell: (r) => <code className="text-theme-xs">{r.sku}</code> },
                  { key: "alert", header: "Alert at", cell: (r) => r.low_stock_threshold },
                  {
                    key: "stock",
                    header: "In stock",
                    cell: (r) => (
                      <span className={`inline-flex min-w-10 justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${r.stock === 0 ? "bg-error-50 text-error-600 dark:bg-error-500/15" : r.is_low_stock ? "bg-warning-50 text-warning-700 dark:bg-warning-500/15" : "bg-success-50 text-success-700 dark:bg-success-500/15"}`}>
                        {r.stock}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: <span className="sr-only">Actions</span>,
                    align: "end",
                    cell: (r) => (
                      <div className="flex justify-end gap-3">
                        <Link to={`/inventory/movements?variant_id=${r.id}`} className="text-sm text-gray-500 hover:text-brand-500">History</Link>
                        <Button size="sm" variant="outline" onClick={() => { setFormError(null); setForm({ direction: "add", quantity: "", reason: "restock", note: "" }); setTarget(r); }}>
                          Adjust
                        </Button>
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

      <Modal isOpen={target !== null} onClose={() => setTarget(null)} className="m-4 max-w-lg p-6 sm:p-8">
        {target && (
          <form onSubmit={adjust} className="space-y-5" noValidate>
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Adjust stock</h2>
              <p className="text-sm text-gray-500">{target.product_name} · {target.sku} · currently <strong>{target.stock}</strong></p>
            </div>
            <Notice tone="error">{formError?.field("quantity") ?? (formError && !Object.keys(formError.errors).length ? formError.message : null)}</Notice>
            <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-2">
              {[["add", "Add stock"], ["remove", "Remove stock"]].map(([value, label]) => (
                <label key={value} className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-medium ${form.direction === value ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10" : "border-gray-300 dark:border-gray-700"}`}>
                  <input type="radio" name="direction" value={value} checked={form.direction === value} onChange={() => setForm({ ...form, direction: value })} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            <TextInput label="Quantity" type="number" min={1} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} error={formError?.field("quantity_change")} />
            <SelectInput label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} options={REASONS} error={formError?.field("reason")} />
            <TextInput label="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={500} placeholder="Supplier invoice #, count date…" />
            {form.quantity && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                New stock: <strong>{target.stock + (form.direction === "add" ? 1 : -1) * Math.abs(Number(form.quantity) || 0)}</strong>
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
              <Button type="submit" loading={busy} disabled={!form.quantity}>Save adjustment</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
