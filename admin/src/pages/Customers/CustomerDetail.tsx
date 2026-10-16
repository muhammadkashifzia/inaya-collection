import { useState } from "react";
import { Link, useParams } from "react-router";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import { ActiveBadge, OrderStatusBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { date, money } from "@/lib/format";
import type { AdminUser, Order } from "@/types/api";

export default function CustomerDetail() {
  const { id = "" } = useParams();
  const { can } = useAuth();
  const { data, error, loading, reload, setData } = useApi(() => http.get<{ data: AdminUser; recent_orders: Order[] }>(`/admin/customers/${id}`), [id]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const customer = data?.data;

  async function toggleActive() {
    if (!customer) return;
    const next = !customer.is_active;
    if (!next && !window.confirm(`Deactivate ${customer.name}? They will be signed out and unable to log in.`)) return;
    setBusy(true);
    try {
      const updated = await http.patch<AdminUser>(`/admin/customers/${id}/status`, { is_active: next });
      setData((prev) => (prev ? { ...prev, data: { ...prev.data, is_active: updated.is_active } } : prev));
      setMessage({ tone: "success", text: next ? "Account reactivated." : "Account deactivated." });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof ApiError ? e.message : "Could not update the account." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageMeta title={`${customer?.name ?? "Customer"} | Inaya Collection Admin`} description="Customer profile." />
      <PageHeader
        title={customer?.name ?? "Customer"}
        description={customer ? `Customer since ${date(customer.created_at)}` : undefined}
        back={{ to: "/customers", label: "Customers" }}
        actions={
          customer &&
          can("manage-customers") && (
            <Button variant={customer.is_active ? "danger" : "primary"} size="sm" loading={busy} onClick={() => void toggleActive()}>
              {customer.is_active ? "Deactivate account" : "Reactivate account"}
            </Button>
          )
        }
      />
      <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)}>
        {customer && data && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-4">
              <Notice tone={message?.tone ?? "success"}>{message?.text}</Notice>
              <Card title="Profile">
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-theme-xs text-gray-500">Email</dt><dd><a href={`mailto:${customer.email}`} className="hover:text-brand-500">{customer.email}</a></dd></div>
                  <div><dt className="text-theme-xs text-gray-500">Phone</dt><dd>{customer.phone ?? "—"}</dd></div>
                  <div><dt className="text-theme-xs text-gray-500">Status</dt><dd><ActiveBadge active={customer.is_active} on="Active" off="Deactivated" /></dd></div>
                  <div><dt className="text-theme-xs text-gray-500">Orders</dt><dd>{customer.orders_count ?? 0}</dd></div>
                  <div><dt className="text-theme-xs text-gray-500">Total spent</dt><dd className="font-semibold">{money(customer.orders_total ?? 0)}</dd></div>
                  <div><dt className="text-theme-xs text-gray-500">Last sign-in</dt><dd>{date(customer.last_login_at, true)}</dd></div>
                </dl>
              </Card>
              <Card title="Saved addresses">
                {customer.addresses?.length ? (
                  <ul className="space-y-4 text-sm">
                    {customer.addresses.map((a) => (
                      <li key={a.id}>
                        <p className="font-medium">{a.label ?? a.full_name}</p>
                        <p className="text-gray-600 dark:text-gray-400">{a.line1}, {a.city} · {a.phone}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No saved addresses.</p>
                )}
              </Card>
            </div>
            <div className="col-span-12 xl:col-span-8">
              <Card title="Recent orders" actions={<Link to={`/orders?q=${encodeURIComponent(customer.email)}`} className="text-sm font-medium text-brand-500 hover:underline">All orders</Link>} bodyClassName="p-0">
                {data.recent_orders.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-500">No orders yet.</p>
                ) : (
                  <DataTable
                    caption="Customer orders"
                    rows={data.recent_orders}
                    rowKey={(o) => o.number}
                    columns={[
                      { key: "n", header: "Order", cell: (o) => <Link to={`/orders/${o.number}`} className="font-medium hover:text-brand-500">{o.number}</Link> },
                      { key: "d", header: "Placed", cell: (o) => date(o.placed_at) },
                      { key: "i", header: "Items", cell: (o) => o.items_count ?? "—" },
                      { key: "s", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
                      { key: "t", header: "Total", align: "end", cell: (o) => money(o.grand_total) },
                    ]}
                  />
                )}
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </>
  );
}
