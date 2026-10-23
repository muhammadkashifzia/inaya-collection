import { Link } from "react-router";
import Card from "@/components/admin/Card";
import DataTable from "@/components/admin/DataTable";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import { date, money } from "@/lib/format";
import type { DashboardData } from "@/types/api";

export function RecentOrders({ orders }: { orders: DashboardData["recent_orders"] }) {
  return (
    <Card title="Recent orders" actions={<Link to="/orders" className="text-sm font-medium text-brand-500 hover:underline">View all</Link>} bodyClassName="p-0">
      {orders.length === 0 ? (
        <p className="p-8 text-center text-sm text-gray-500">No orders yet.</p>
      ) : (
        <DataTable
          caption="Recent orders"
          rows={orders}
          rowKey={(o) => o.number}
          mobileCard={(o) => (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="mb-2 flex items-start justify-between gap-2">
                <Link to={`/orders/${o.number}`} className="font-medium text-ink-900 hover:text-brand-500 dark:text-white">{o.number}</Link>
                <span className="font-semibold">{money(o.grand_total)}</span>
              </div>
              <p className="mb-2 truncate text-sm text-gray-600 dark:text-gray-400">{o.customer_name} · {date(o.placed_at)}</p>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={o.status} />
                <PaymentStatusBadge status={o.payment_status} />
              </div>
            </div>
          )}
          columns={[
            { key: "number", header: "Order", cell: (o) => <Link to={`/orders/${o.number}`} className="font-medium text-ink-900 hover:text-brand-500 dark:text-white">{o.number}</Link> },
            { key: "customer", header: "Customer", cell: (o) => <span className="block max-w-40 truncate">{o.customer_name}</span> },
            { key: "date", header: "Placed", cell: (o) => date(o.placed_at) },
            { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
            { key: "payment", header: "Payment", cell: (o) => <PaymentStatusBadge status={o.payment_status} /> },
            { key: "total", header: "Total", align: "end", cell: (o) => <span className="font-semibold">{money(o.grand_total)}</span> },
          ]}
        />
      )}
    </Card>
  );
}

export function BestSellers({ items }: { items: DashboardData["best_sellers"] }) {
  const max = Math.max(1, ...items.map((i) => i.units));
  return (
    <Card title="Best sellers" description="By units sold in completed orders">
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No sales yet.</p>
      ) : (
        <ol className="space-y-4">
          {items.map((item, index) => (
            <li key={item.product_id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <Link to={`/products/${item.product_id}`} className="truncate font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">
                  <span className="me-2 text-gray-400">{index + 1}.</span>
                  {item.name}
                </Link>
                <span className="shrink-0 text-theme-xs text-gray-500">
                  {item.units} sold · {money(item.revenue)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/5" aria-hidden="true">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(item.units / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function LowStock({ items }: { items: DashboardData["low_stock"] }) {
  return (
    <Card title="Low stock" actions={<Link to="/inventory?low_stock=1" className="text-sm font-medium text-brand-500 hover:underline">Manage</Link>}>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">All products are well stocked.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <Link to={`/products/${v.product_id}`} className="block truncate font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">
                  {v.product_name}
                </Link>
                <span className="text-theme-xs text-gray-500">
                  {v.sku}
                  {v.name !== "Default" && ` · ${v.name}`}
                </span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-theme-xs font-semibold ${v.stock === 0 ? "bg-error-50 text-error-600 dark:bg-error-500/15" : "bg-warning-50 text-warning-700 dark:bg-warning-500/15"}`}>
                {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
