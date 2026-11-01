import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import FilterBar, { FilterSelect } from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { DeleteAction, EditAction, ToggleActiveAction, ViewAction } from "@/components/admin/TableActions";
import PageMeta from "@/components/common/PageMeta";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { ApiError, http } from "@/lib/api";
import { date, money } from "@/lib/format";
import type { AdminUser, Paginated } from "@/types/api";

export default function CustomerList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const { values, page, set } = useListQuery(["q", "is_active"] as const);
  const { data, error, loading, reload } = useApi(
    () => http.get<Paginated<AdminUser>>("/admin/customers", { q: values.q, is_active: values.is_active === "" ? undefined : values.is_active === "1", page, per_page: 20 }),
    [values, page],
  );

  /* ── Delete ── */
  const [confirmCustomer, setConfirmCustomer] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function onConfirmDelete() {
    if (!confirmCustomer) return;
    setDeleting(true);
    try {
      await http.delete(`/admin/customers/${confirmCustomer.id}`);
      toast.success("Customer deleted.");
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete customer.");
    } finally {
      setDeleting(false);
      setConfirmCustomer(null);
    }
  }

  /* ── Toggle active/deactivate ── */
  const [confirmToggle, setConfirmToggle] = useState<AdminUser | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  function handleToggle(c: AdminUser) {
    if (c.is_active) {
      setConfirmToggle(c);
    } else {
      void doToggle(c, true);
    }
  }

  async function doToggle(c: AdminUser, next: boolean) {
    setToggling(c.id);
    try {
      await http.patch(`/admin/customers/${c.id}/status`, { is_active: next });
      toast.success(next ? "Account reactivated." : "Account deactivated.");
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update status.");
    } finally {
      setToggling(null);
    }
  }

  async function onConfirmDeactivate() {
    if (!confirmToggle) return;
    await doToggle(confirmToggle, false);
    setConfirmToggle(null);
  }

  const canManage = can("manage-customers");

  return (
    <>
      <PageMeta title="Customers | Anaya Collection Admin" description="Customer accounts." />
      <PageHeader title="Customers" description="Registered customer accounts. Guest orders appear under Orders." />
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Name, email or phone">
          <FilterSelect label="Status" value={values.is_active} onChange={(v) => set("is_active", v)} options={[{ value: "1", label: "Active" }, { value: "0", label: "Deactivated" }]} />
        </FilterBar>
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.data.length === 0} emptyTitle="No customers found.">
          {data && (
            <>
              <DataTable
                caption="Customers"
                rows={data.data}
                rowKey={(c) => c.id}
                mobileCard={(c) => (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          {c.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/customers/${c.id}`} className="block truncate font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{c.name}</Link>
                          <p className="truncate text-theme-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                      <ActiveBadge active={c.is_active} on="Active" off="Deactivated" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.phone && <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">📞 {c.phone}</span>}
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">🛒 {c.orders_count ?? 0} orders</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">💰 {money(c.orders_total ?? 0)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">📅 {date(c.created_at)}</span>
                    </div>
                    {canManage && (
                      <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <ViewAction onClick={() => void navigate(`/customers/${c.id}`)} />
                        <EditAction onClick={() => void navigate(`/customers/${c.id}`)} />
                        <ToggleActiveAction active={c.is_active} onClick={() => handleToggle(c)} disabled={toggling === c.id} />
                        <DeleteAction onClick={() => setConfirmCustomer(c)} />
                      </div>
                    )}
                  </div>
                )}
                columns={[
                  {
                    key: "name",
                    header: "Customer",
                    cell: (c) => (
                      <div>
                        <Link to={`/customers/${c.id}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{c.name}</Link>
                        <p className="text-theme-xs text-gray-500">{c.email}</p>
                      </div>
                    ),
                  },
                  { key: "phone", header: "Phone", cell: (c) => c.phone ?? "—" },
                  { key: "orders", header: "Orders", cell: (c) => c.orders_count ?? 0 },
                  { key: "spent", header: "Total spent", cell: (c) => money(c.orders_total ?? 0) },
                  { key: "joined", header: "Joined", cell: (c) => date(c.created_at) },
                  { key: "status", header: "Status", cell: (c) => <ActiveBadge active={c.is_active} on="Active" off="Deactivated" /> },
                  {
                    key: "actions",
                    header: "Action",
                    align: "end",
                    cell: (c) => (
                      <div className="flex items-center justify-end gap-1">
                        <ViewAction onClick={() => void navigate(`/customers/${c.id}`)} />
                        <EditAction onClick={() => void navigate(`/customers/${c.id}`)} />
                        {canManage && (
                          <>
                            <ToggleActiveAction active={c.is_active} onClick={() => handleToggle(c)} disabled={toggling === c.id} />
                            <DeleteAction onClick={() => setConfirmCustomer(c)} />
                          </>
                        )}
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

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmCustomer !== null}
        title="Delete customer"
        message={`Are you sure you want to delete "${confirmCustomer?.name ?? ""}"? This will remove their account, addresses, and session data. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => setConfirmCustomer(null)}
      />

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={confirmToggle !== null}
        title={`Deactivate ${confirmToggle?.name ?? ""}?`}
        message="They will be signed out and unable to log in until reactivated."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void onConfirmDeactivate()}
        onCancel={() => setConfirmToggle(null)}
      />
    </>
  );
}
