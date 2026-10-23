import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import PageMeta from "@/components/common/PageMeta";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { http } from "@/lib/api";
import { date } from "@/lib/format";
import type { InventoryMovement, InventoryReason, Paginated } from "@/types/api";

const REASON_LABEL: Record<InventoryReason, string> = {
  initial_stock: "Initial stock",
  restock: "Restock",
  correction: "Correction",
  damaged: "Damaged",
  sale: "Sale",
  order_cancelled: "Order cancelled",
  return: "Return",
};

export default function Movements() {
  const { values, page, set } = useListQuery(["variant_id"] as const);
  const { data, error, loading, reload } = useApi(() => http.get<Paginated<InventoryMovement>>("/admin/inventory/movements", { variant_id: values.variant_id, page, per_page: 25 }), [values, page]);

  return (
    <>
      <PageMeta title="Stock history | Anaya Collection Admin" description="Audit log of stock changes." />
      <PageHeader
        title="Stock history"
        description="Every stock change: sales, cancellations and manual adjustments."
        back={{ to: "/inventory", label: "Inventory" }}
        actions={values.variant_id && <button type="button" className="text-sm font-medium text-brand-500" onClick={() => set("variant_id", "")}>Show all variants</button>}
      />
      <Card bodyClassName="p-4 md:p-5">
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.data.length === 0} emptyTitle="No stock changes recorded yet.">
          {data && (
            <>
              <DataTable
                caption="Stock movements"
                rows={data.data}
                rowKey={(m) => m.id}
                mobileCard={(m) => (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <button type="button" className="text-start hover:text-brand-500" onClick={() => set("variant_id", m.variant_id)}>
                          <span className="block font-medium text-gray-800 dark:text-white/90">{m.product_name ?? "—"}</span>
                          <code className="text-theme-xs text-gray-500">{m.sku}</code>
                        </button>
                      </div>
                      <span className={`shrink-0 font-semibold ${m.quantity_change > 0 ? "text-success-600" : "text-error-600"}`}>
                        {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">{date(m.created_at, true)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">{REASON_LABEL[m.reason] ?? m.reason}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">After: {m.stock_after}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">{m.by ?? (m.order_id ? "Checkout" : "System")}</span>
                    </div>
                    {m.note && <p className="mt-2 truncate text-theme-xs text-gray-500">{m.note}</p>}
                  </div>
                )}
                columns={[
                  { key: "date", header: "When", cell: (m) => date(m.created_at, true) },
                  {
                    key: "product",
                    header: "Product",
                    cell: (m) => (
                      <button type="button" className="text-start hover:text-brand-500" onClick={() => set("variant_id", m.variant_id)}>
                        <span className="block font-medium text-gray-800 dark:text-white/90">{m.product_name ?? "—"}</span>
                        <code className="text-theme-xs text-gray-500">{m.sku}</code>
                      </button>
                    ),
                  },
                  { key: "reason", header: "Reason", cell: (m) => REASON_LABEL[m.reason] ?? m.reason },
                  {
                    key: "change",
                    header: "Change",
                    cell: (m) => <span className={`font-semibold ${m.quantity_change > 0 ? "text-success-600" : "text-error-600"}`}>{m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}</span>,
                  },
                  { key: "after", header: "Stock after", cell: (m) => m.stock_after },
                  { key: "by", header: "By", cell: (m) => m.by ?? (m.order_id ? "Checkout" : "System") },
                  { key: "note", header: "Note", cell: (m) => <span className="block max-w-56 truncate text-gray-500" title={m.note ?? undefined}>{m.note ?? "—"}</span> },
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
