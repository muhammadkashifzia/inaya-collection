import { Link } from "react-router";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import FilterBar, { FilterSelect } from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { http } from "@/lib/api";
import { date, money, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { Order, Paginated } from "@/types/api";

const dateInput =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

export default function OrderList() {
  const { values, page, set } = useListQuery(["q", "status", "payment_status", "from", "to"] as const);
  const { data, error, loading, reload } = useApi(() => http.get<Paginated<Order>>("/admin/orders", { ...values, page, per_page: 20 }), [values, page]);

  return (
    <>
      <PageMeta title="Orders | Galaxy Wear Admin" description="View and manage customer orders." />
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
