import { useState } from "react";
import { Link } from "react-router";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice } from "@/components/admin/Fields";
import FilterBar, { FilterSelect } from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import { DeleteAction, EditAction } from "@/components/admin/TableActions";
import Pagination from "@/components/admin/Pagination";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { ApiError, http } from "@/lib/api";
import { date } from "@/lib/format";
import type { Paginated, ProductReview, ReviewStatus } from "@/types/api";
import ReviewEditorModal from "./ReviewEditorModal";

type ReviewPage = Paginated<ProductReview> & { counts: Record<ReviewStatus, number> };

const STATUS_LABEL: Record<ReviewStatus, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const STATUS_COLOR: Record<ReviewStatus, "warning" | "success" | "light"> = { pending: "warning", approved: "success", rejected: "light" };

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="whitespace-nowrap tracking-wider" role="img" aria-label={`${rating} out of 5 stars`}>
      <span className="text-warning-500">{"★".repeat(rating)}</span>
      <span className="text-gray-300 dark:text-gray-600">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/** Review moderation: new storefront reviews arrive as pending. */
export default function Reviews() {
  const { values, page, set } = useListQuery(["q", "status", "rating"] as const);
  const { data, error, loading, reload } = useApi(
    () => http.get<ReviewPage>("/admin/reviews", { q: values.q, status: values.status, rating: values.rating, page, per_page: 20 }),
    [values, page],
  );
  const [editing, setEditing] = useState<ProductReview | "new" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function setStatus(r: ProductReview, status: ReviewStatus) {
    setBusyId(r.id);
    try {
      await http.put(`/admin/reviews/${r.id}`, { status });
      setNotice({ tone: "success", text: `Review ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "moved to pending"}.` });
      reload();
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof ApiError ? err.firstMessage : "Could not update the review." });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r: ProductReview) {
    if (!window.confirm(`Delete the review by ${r.name}? This cannot be undone.`)) return;
    setBusyId(r.id);
    try {
      await http.delete(`/admin/reviews/${r.id}`);
      setNotice({ tone: "success", text: "Review deleted." });
      reload();
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof ApiError ? err.firstMessage : "Could not delete." });
    } finally {
      setBusyId(null);
    }
  }

  const counts = data?.counts;

  return (
    <>
      <PageMeta title="Reviews | Anaya Collection Admin" description="Moderate customer product reviews." />
      <PageHeader
        title="Reviews"
        description={counts ? `${counts.pending} pending · ${counts.approved} approved · ${counts.rejected} rejected. Only approved reviews show on the store.` : "Only approved reviews show on the store."}
        actions={<Button onClick={() => setEditing("new")}>+ Add review</Button>}
      />
      <div className="mb-4">
        <Notice tone={notice?.tone ?? "success"}>{notice?.text}</Notice>
      </div>
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Customer, product or review text">
          <FilterSelect
            label="Status"
            value={values.status}
            onChange={(v) => set("status", v)}
            options={(Object.keys(STATUS_LABEL) as ReviewStatus[]).map((s) => ({ value: s, label: `${STATUS_LABEL[s]}${counts ? ` (${counts[s]})` : ""}` }))}
          />
          <FilterSelect label="Rating" value={values.rating} onChange={(v) => set("rating", v)} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? "" : "s"}` }))} />
        </FilterBar>
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.data.length === 0} emptyTitle="No reviews found.">
          {data && (
            <>
              <DataTable
                caption="Product reviews"
                rows={data.data}
                rowKey={(r) => r.id}
                mobileCard={(r) => (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <StarRating rating={r.rating} />
                        {r.title && <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{r.title}</p>}
                      </div>
                      <Badge size="sm" color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <p className="mb-2 line-clamp-3 text-theme-xs whitespace-pre-line text-gray-600 dark:text-gray-400">{r.body}</p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {r.product && (
                        <Link to={`/products/${r.product.id}`} className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400">
                          📦 {r.product.name}
                        </Link>
                      )}
                      <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                        👤 {r.name}{r.is_verified_buyer && " ✓"}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                        {date(r.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
                      {r.status !== "approved" && (
                        <button type="button" disabled={busyId === r.id} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-success-600 hover:bg-success-50 disabled:opacity-50 dark:text-success-500" onClick={() => void setStatus(r, "approved")}>Approve</button>
                      )}
                      {r.status !== "rejected" && (
                        <button type="button" disabled={busyId === r.id} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-warning-600 hover:bg-warning-50 disabled:opacity-50 dark:text-warning-500" onClick={() => void setStatus(r, "rejected")}>Reject</button>
                      )}
                      <EditAction onClick={() => setEditing(r)} />
                      <DeleteAction onClick={() => void remove(r)} disabled={busyId === r.id} />
                    </div>
                  </div>
                )}
                columns={[
                  {
                    key: "review",
                    header: "Review",
                    cell: (r) => (
                      <div className="max-w-md space-y-1">
                        <StarRating rating={r.rating} />
                        {r.title && <p className="font-medium text-gray-800 dark:text-white/90">{r.title}</p>}
                        <p className="line-clamp-3 text-theme-xs whitespace-pre-line text-gray-600 dark:text-gray-400">{r.body}</p>
                      </div>
                    ),
                  },
                  {
                    key: "product",
                    header: "Product",
                    cell: (r) =>
                      r.product ? (
                        <Link to={`/products/${r.product.id}`} className="font-medium text-gray-700 hover:text-brand-500 dark:text-gray-300">{r.product.name}</Link>
                      ) : (
                        "—"
                      ),
                  },
                  {
                    key: "customer",
                    header: "Customer",
                    cell: (r) => (
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">{r.name}</p>
                        {r.email && <p className="text-theme-xs text-gray-500 dark:text-gray-400">{r.email}</p>}
                        {r.is_verified_buyer && <p className="text-theme-xs font-medium text-success-600 dark:text-success-500">Verified buyer</p>}
                      </div>
                    ),
                  },
                  { key: "date", header: "Date", cell: (r) => <span className="whitespace-nowrap">{date(r.created_at)}</span> },
                  {
                    key: "status",
                    header: "Status",
                    cell: (r) => (
                      <Badge size="sm" color={STATUS_COLOR[r.status]}>
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    header: <span className="sr-only">Actions</span>,
                    align: "end",
                    cell: (r) => (
                      <div className="flex flex-wrap justify-end gap-x-1 gap-y-1 text-sm font-medium">
                        {r.status !== "approved" && (
                          <button type="button" disabled={busyId === r.id} className="rounded-lg px-2 py-1.5 text-success-600 hover:bg-success-50 disabled:opacity-50 dark:text-success-500 dark:hover:bg-success-500/10" onClick={() => void setStatus(r, "approved")}>Approve</button>
                        )}
                        {r.status !== "rejected" && (
                          <button type="button" disabled={busyId === r.id} className="rounded-lg px-2 py-1.5 text-warning-600 hover:bg-warning-50 disabled:opacity-50 dark:text-warning-500 dark:hover:bg-warning-500/10" onClick={() => void setStatus(r, "rejected")}>Reject</button>
                        )}
                        <EditAction onClick={() => setEditing(r)} />
                        <DeleteAction onClick={() => void remove(r)} disabled={busyId === r.id} />
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

      <ReviewEditorModal
        review={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setNotice({ tone: "success", text: "Review saved." });
          reload();
        }}
      />
    </>
  );
}
