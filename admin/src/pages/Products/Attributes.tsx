import { useState } from "react";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice, TextInput } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import type { ProductAttribute } from "@/types/api";

interface Draft {
  id?: number;
  name: string;
  sort_order: string;
  values: string[];
  newValue: string;
}

/** Variant attributes (Color, Size…) and their values, suggested in the product variant editor. */
export default function Attributes() {
  const { data, error, loading, reload } = useApi(() => http.get<ProductAttribute[]>("/admin/attributes"), []);
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [confirmAttr, setConfirmAttr] = useState<ProductAttribute | null>(null);

  const open = (a?: ProductAttribute) => {
    setFormError(null);
    setDraft(
      a
        ? { id: a.id, name: a.name, sort_order: String(a.sort_order), values: a.values.map((v) => v.value), newValue: "" }
        : { name: "", sort_order: String(data?.length ?? 0), values: [], newValue: "" },
    );
  };

  /** Adds comma-separated values typed in the input, skipping duplicates. */
  const addValues = (d: Draft): Draft => {
    const incoming = d.newValue.split(",").map((v) => v.trim()).filter(Boolean);
    const existing = new Set(d.values.map((v) => v.toLowerCase()));
    const fresh = incoming.filter((v) => {
      const key = v.toLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    return { ...d, values: [...d.values, ...fresh], newValue: "" };
  };

  const move = (d: Draft, index: number, delta: number): Draft => {
    const target = index + delta;
    if (target < 0 || target >= d.values.length) return d;
    const values = [...d.values];
    [values[index], values[target]] = [values[target], values[index]];
    return { ...d, values };
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const final = draft.newValue.trim() ? addValues(draft) : draft;
    setDraft(final);
    setBusy(true);
    setFormError(null);
    const body = { name: final.name, sort_order: Number(final.sort_order || 0), values: final.values };
    try {
      if (final.id) await http.put(`/admin/attributes/${final.id}`, body);
      else await http.post("/admin/attributes", body);
      setDraft(null);
      toast.success("Attribute saved.");
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  function remove(a: ProductAttribute) {
    setConfirmAttr(a);
  }

  async function onConfirmRemove() {
    if (!confirmAttr) return;
    try {
      await http.delete(`/admin/attributes/${confirmAttr.id}`);
      toast.success("Attribute deleted.");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.firstMessage : "Could not delete.");
    } finally {
      setConfirmAttr(null);
    }
  }

  const fe = (k: string) => formError?.field(k);
  const valuesError = formError ? Object.entries(formError.errors).find(([k]) => k === "values" || k.startsWith("values."))?.[1][0] : undefined;

  return (
    <>
      <PageMeta title="Attributes | Anaya Collection Admin" description="Variant attributes such as color and size." />
      <PageHeader
        title="Attributes"
        description="Options such as Color or Size. Their values are suggested when you add product variants."
        actions={<Button onClick={() => open()}>+ Add attribute</Button>}
      />
      <Card bodyClassName="p-0">
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle="No attributes yet.">
          {data && (
            <DataTable
              caption="Attributes"
              rows={data}
              rowKey={(a) => a.id}
              columns={[
                {
                  key: "name",
                  header: "Attribute",
                  cell: (a) => (
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{a.name}</p>
                      <p className="text-theme-xs text-gray-500 dark:text-gray-400">Option key: {a.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "values",
                  header: "Values",
                  cell: (a) =>
                    a.values.length ? (
                      <div className="flex max-w-xl flex-wrap gap-1.5">
                        {a.values.slice(0, 12).map((v) => (
                          <Badge key={v.id} size="sm" color="light">{v.value}</Badge>
                        ))}
                        {a.values.length > 12 && <span className="text-theme-xs text-gray-500 dark:text-gray-400">+{a.values.length - 12} more</span>}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    ),
                },
                { key: "order", header: "Order", cell: (a) => a.sort_order },
                {
                  key: "actions",
                  header: <span className="sr-only">Actions</span>,
                  align: "end",
                  cell: (a) => (
                    <div className="flex justify-end gap-3 text-sm font-medium">
                      <button type="button" className="text-brand-500 hover:underline" onClick={() => open(a)}>Edit</button>
                      <button type="button" className="text-gray-500 hover:text-error-600 dark:text-gray-400" onClick={() => void remove(a)}>Delete</button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </DataState>
      </Card>

      <Modal isOpen={draft !== null} onClose={() => setDraft(null)} className="m-4 max-w-2xl p-6 sm:p-8">
        {draft && (
          <form onSubmit={save} noValidate className="max-h-[80vh] space-y-5 overflow-y-auto pe-1">
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit attribute" : "New attribute"}</h2>
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                className="md:col-span-2"
                label="Name"
                required
                autoFocus
                value={draft.name}
                error={fe("name") ?? fe("slug")}
                maxLength={60}
                placeholder="Color"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <TextInput label="Sort order" type="number" min={0} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
            </div>

            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <TextInput
                  className="flex-1"
                  label="Add values"
                  value={draft.newValue}
                  maxLength={300}
                  placeholder="Maroon, Black, Navy"
                  hint="Separate several values with commas, then press Enter."
                  onChange={(e) => setDraft({ ...draft, newValue: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setDraft(addValues(draft));
                    }
                  }}
                />
                <Button variant="outline" className="mb-6" onClick={() => setDraft(addValues(draft))} disabled={!draft.newValue.trim()}>
                  Add
                </Button>
              </div>
              {valuesError && <p className="text-theme-xs font-medium text-error-600 dark:text-error-400">{valuesError}</p>}

              {draft.values.length > 0 ? (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800" aria-label="Attribute values">
                  {draft.values.map((v, i) => (
                    <li key={v} className="flex items-center gap-3 px-4 py-2 text-sm">
                      <span className="flex-1 text-gray-800 dark:text-white/90">{v}</span>
                      <button type="button" className="px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200" aria-label={`Move ${v} up`} disabled={i === 0} onClick={() => setDraft(move(draft, i, -1))}>↑</button>
                      <button type="button" className="px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200" aria-label={`Move ${v} down`} disabled={i === draft.values.length - 1} onClick={() => setDraft(move(draft, i, 1))}>↓</button>
                      <button type="button" className="px-1 text-gray-400 hover:text-error-500" aria-label={`Remove ${v}`} onClick={() => setDraft({ ...draft, values: draft.values.filter((_, vi) => vi !== i) })}>×</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No values yet.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save attribute</Button>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmDialog
        open={confirmAttr !== null}
        title={`Delete attribute "${confirmAttr?.name}"?`}
        message={confirmAttr ? `Existing product variants keep their ${confirmAttr.name.toLowerCase()} values. This cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setConfirmAttr(null)}
      />
    </>
  );
}
