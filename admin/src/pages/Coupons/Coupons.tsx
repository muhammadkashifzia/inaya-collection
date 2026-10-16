import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice, SelectInput, TextInput, Toggle } from "@/components/admin/Fields";
import FilterBar from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { ApiError, http } from "@/lib/api";
import { date, money, toLocalInput } from "@/lib/format";
import type { Category, Coupon, CouponType, Paginated } from "@/types/api";

interface Draft {
  id?: number;
  code: string;
  description: string;
  type: CouponType;
  value: string;
  min_order_amount: string;
  max_discount_amount: string;
  starts_at: string;
  expires_at: string;
  usage_limit: string;
  per_customer_limit: string;
  is_active: boolean;
  category_ids: number[];
}

const blank: Draft = { code: "", description: "", type: "percentage", value: "", min_order_amount: "", max_discount_amount: "", starts_at: "", expires_at: "", usage_limit: "", per_customer_limit: "1", is_active: true, category_ids: [] };

function couponState(c: Coupon): { label: string; active: boolean } {
  const now = Date.now();
  if (!c.is_active) return { label: "Disabled", active: false };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { label: "Expired", active: false };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: "Scheduled", active: false };
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) return { label: "Used up", active: false };
  return { label: "Active", active: true };
}

export default function Coupons() {
  const { values, page, set } = useListQuery(["q"] as const);
  const { data, error, loading, reload } = useApi(() => http.get<Paginated<Coupon>>("/admin/coupons", { q: values.q, page }), [values, page]);
  const categories = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const open = (c?: Coupon) => {
    setFormError(null);
    setDraft(
      c
        ? {
            id: c.id,
            code: c.code,
            description: c.description ?? "",
            type: c.type,
            value: String(c.value),
            min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "",
            max_discount_amount: c.max_discount_amount != null ? String(c.max_discount_amount) : "",
            starts_at: toLocalInput(c.starts_at),
            expires_at: toLocalInput(c.expires_at),
            usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
            per_customer_limit: c.per_customer_limit != null ? String(c.per_customer_limit) : "",
            is_active: c.is_active,
            category_ids: c.category_ids ?? [],
          }
        : blank,
    );
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    const num = (v: string) => (v === "" ? null : Number(v));
    const body = {
      code: draft.code,
      description: draft.description || null,
      type: draft.type,
      value: num(draft.value),
      min_order_amount: num(draft.min_order_amount) ?? 0,
      max_discount_amount: num(draft.max_discount_amount),
      starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : null,
      usage_limit: num(draft.usage_limit),
      per_customer_limit: num(draft.per_customer_limit),
      is_active: draft.is_active,
      category_ids: draft.category_ids,
      product_ids: [],
    };
    try {
      if (draft.id) await http.put(`/admin/coupons/${draft.id}`, body);
      else await http.post("/admin/coupons", body);
      setDraft(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Coupon) {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    await http.delete(`/admin/coupons/${c.id}`);
    reload();
  }

  const fe = (k: string) => formError?.field(k);

  return (
    <>
      <PageMeta title="Coupons | Galaxy Wear Admin" description="Discount codes." />
      <PageHeader title="Coupons" description="Discount codes customers enter in the cart or at checkout." actions={<Button onClick={() => open()}>+ New coupon</Button>} />
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Search code" />
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.data.length === 0} emptyTitle="No coupons yet." emptyAction={<Button size="sm" onClick={() => open()}>Create a coupon</Button>}>
          {data && (
            <>
              <DataTable
                caption="Coupons"
                rows={data.data}
                rowKey={(c) => c.id}
                columns={[
                  { key: "code", header: "Code", cell: (c) => <span><code className="rounded bg-gray-100 px-2 py-1 font-semibold dark:bg-white/5">{c.code}</code>{c.description && <span className="block pt-1 text-theme-xs text-gray-500">{c.description}</span>}</span> },
                  { key: "value", header: "Discount", cell: (c) => (c.type === "percentage" ? `${c.value}% off` : `${money(c.value)} off`) },
                  { key: "min", header: "Min. order", cell: (c) => (c.min_order_amount ? money(c.min_order_amount) : "—") },
                  { key: "used", header: "Used", cell: (c) => `${c.used_count}${c.usage_limit ? ` / ${c.usage_limit}` : ""}` },
                  { key: "dates", header: "Valid", cell: (c) => (c.starts_at || c.expires_at ? `${date(c.starts_at) === "—" ? "Now" : date(c.starts_at)} → ${date(c.expires_at) === "—" ? "No end" : date(c.expires_at)}` : "Always") },
                  { key: "status", header: "Status", cell: (c) => { const s = couponState(c); return <ActiveBadge active={s.active} on={s.label} off={s.label} />; } },
                  {
                    key: "actions",
                    header: <span className="sr-only">Actions</span>,
                    align: "end",
                    cell: (c) => (
                      <div className="flex justify-end gap-3 text-sm font-medium">
                        <button type="button" className="text-brand-500 hover:underline" onClick={() => open(c)}>Edit</button>
                        <button type="button" className="text-gray-500 hover:text-error-600" onClick={() => void remove(c)}>Delete</button>
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

      <Modal isOpen={draft !== null} onClose={() => setDraft(null)} className="m-4 max-w-2xl p-6 sm:p-8">
        {draft && (
          <form onSubmit={save} noValidate className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? `Edit ${draft.code}` : "New coupon"}</h2>
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Code" required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} error={fe("code")} maxLength={50} placeholder="WINTER10" />
              <TextInput label="Description (internal)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={255} />
              <SelectInput label="Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as CouponType })} options={[{ value: "percentage", label: "Percentage off" }, { value: "fixed", label: "Fixed amount off (Rs.)" }]} />
              <TextInput label={draft.type === "percentage" ? "Percent (1–100)" : "Amount (Rs.)"} type="number" min={1} max={draft.type === "percentage" ? 100 : undefined} required value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} error={fe("value")} />
              <TextInput label="Minimum order (Rs.)" type="number" min={0} value={draft.min_order_amount} onChange={(e) => setDraft({ ...draft, min_order_amount: e.target.value })} error={fe("min_order_amount")} />
              <TextInput label="Max discount (Rs.)" type="number" min={1} value={draft.max_discount_amount} onChange={(e) => setDraft({ ...draft, max_discount_amount: e.target.value })} hint="Caps percentage coupons" error={fe("max_discount_amount")} />
              <TextInput label="Starts" type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} />
              <TextInput label="Expires" type="datetime-local" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} error={fe("expires_at")} />
              <TextInput label="Total uses allowed" type="number" min={1} value={draft.usage_limit} onChange={(e) => setDraft({ ...draft, usage_limit: e.target.value })} hint="Empty = unlimited" />
              <TextInput label="Uses per customer" type="number" min={1} value={draft.per_customer_limit} onChange={(e) => setDraft({ ...draft, per_customer_limit: e.target.value })} hint="Matched by account or email" />
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Only for these categories (optional)</legend>
              <div className="flex flex-wrap gap-2">
                {(categories.data ?? []).map((c) => {
                  const on = draft.category_ids.includes(c.id);
                  return (
                    <button key={c.id} type="button" aria-pressed={on} onClick={() => setDraft({ ...draft, category_ids: on ? draft.category_ids.filter((x) => x !== c.id) : [...draft.category_ids, c.id] })} className={`rounded-full px-3 py-1.5 text-theme-xs font-medium ring-1 ${on ? "bg-brand-500 text-white ring-brand-500" : "text-gray-600 ring-gray-300 dark:text-gray-300 dark:ring-gray-700"}`}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Toggle label="Active" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save coupon</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
