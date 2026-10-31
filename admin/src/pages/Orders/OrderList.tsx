import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import FilterBar, { FilterSelect } from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import { DeleteAction, EditAction, ViewAction } from "@/components/admin/TableActions";
import PageMeta from "@/components/common/PageMeta";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { http } from "@/lib/api";
import { date, money, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { Order, Paginated } from "@/types/api";

const dateInput =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

export default function OrderList() {
  const navigate = useNavigate();
  const { values, page, set } = useListQuery(["q", "status", "payment_status", "from", "to"] as const);
  const { data, error, loading, reload } = useApi(() => http.get<Paginated<Order>>("/admin/orders", { ...values, page, per_page: 20 }), [values, page]);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);

  async function onConfirmDelete() {
    if (!confirmOrder) return;
    try {
      await http.delete(`/admin/orders/${confirmOrder.id}`);
      reload();
    } catch {
      // handled silently
    } finally {
      setConfirmOrder(null);
    }
  }

  return (
    <>
      <PageMeta title="Orders | Anaya Collection Admin" description="View and manage customer orders." />
      <PageHeader title="Orders" description="Search, filter and process customer orders." />
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Order number, name, email or phone">
          <FilterSelect label="Status" value={values.status} onChange={(v) => set("status", v)} options={Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          <FilterSelect label="Payment" value={values.payment_status} onChange={(v) => set("payment_status", v)} options={Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          <label className="flex items-center gap-2 text-sm text-gray-500">
            From <input type="date" className={dateInput} value={values.from} onChange={(e) => set("from", e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            To <input type="date" className={dateInput} value={values.to} min={values.from || undefined} onChange={(e) => set("to", e.target.value)} />
          </label>
        </FilterBar>

        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.data.length === 0} emptyTitle="No orders match these filters.">
          {data && (
            <>
              <DataTable
                caption="Orders"
                rows={data.data}
                rowKey={(o) => o.number}
                mobileCard={(o) => (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/orders/${o.number}`} className="text-base font-semibold text-ink-900 hover:text-brand-500 dark:text-white">{o.number}</Link>
                        <p className="mt-0.5 text-theme-xs text-gray-500">{date(o.placed_at, true)}</p>
                      </div>
                      <span className="font-semibold text-ink-900 dark:text-white">{money(o.grand_total)}</span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{o.customer_name}</p>
                      <p className="text-theme-xs text-gray-500">{o.phone}</p>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {o.shipping_address?.city && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">📍 {o.shipping_address.city}</span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">📦 {o.items_count ?? "—"} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.payment_status} />
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <ViewAction onClick={() => void navigate(`/orders/${o.number}`)} />
                      <EditAction onClick={() => void navigate(`/orders/${o.number}`)} />
                      <DeleteAction onClick={() => setConfirmOrder(o)} />
                    </div>
                  </div>
                )}
                columns={[
                  { key: "number", header: "Order", cell: (o) => <Link to={`/orders/${o.number}`} className="font-semibold text-ink-900 hover:text-brand-500 dark:text-white">{o.number}</Link> },
                  { key: "date", header: "Placed", cell: (o) => date(o.placed_at, true) },
                  {
                    key: "customer",
                    header: "Customer",
                    cell: (o) => (
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">{o.customer_name}</p>
                        <p className="text-theme-xs text-gray-500">{o.phone}</p>
                      </div>
                    ),
                  },
                  { key: "city", header: "City", cell: (o) => o.shipping_address?.city ?? "—" },
                  { key: "items", header: "Items", cell: (o) => o.items_count ?? "—" },
                  { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
                  { key: "payment", header: "Payment", cell: (o) => <PaymentStatusBadge status={o.payment_status} /> },
                  { key: "total", header: "Total", align: "end", cell: (o) => <span className="font-semibold">{money(o.grand_total)}</span> },
                  {
                    key: "actions",
                    header: "Action",
                    align: "end",
                    cell: (o) => (
                      <div className="flex items-center justify-end gap-1">
                        <ViewAction onClick={() => void navigate(`/orders/${o.number}`)} />
                        <EditAction onClick={() => void navigate(`/orders/${o.number}`)} />
                        <DeleteAction onClick={() => setConfirmOrder(o)} />
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
        open={confirmOrder !== null}
        title="Delete order"
        message={`Are you sure you want to delete order ${confirmOrder?.number ?? ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmOrder(null)}
      />
    </>
  );
}
