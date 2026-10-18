import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice, TextInput } from "@/components/admin/Fields";
import FilterBar from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { ApiError, http } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Tag } from "@/types/api";

interface Draft {
  id?: number;
  name: string;
  slug: string;
}

/** Product tags (New Arrival, Winter 2026…). Assigned from the product form. */
export default function Tags() {
  const { values, set } = useListQuery(["q"] as const);
  const { data, error, loading, reload } = useApi(() => http.get<Tag[]>("/admin/tags", { q: values.q }), [values.q]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const open = (t?: Tag) => {
    setFormError(null);
    setDraft(t ? { id: t.id, name: t.name, slug: t.slug } : { name: "", slug: "" });
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    const body = { name: draft.name, slug: draft.slug || null };
    try {
      if (draft.id) await http.put(`/admin/tags/${draft.id}`, body);
      else await http.post("/admin/tags", body);
      setDraft(null);
      setNotice({ tone: "success", text: "Tag saved." });
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: Tag) {
    const used = t.products_count ? ` It will be removed from ${t.products_count} product${t.products_count === 1 ? "" : "s"}.` : "";
    if (!window.confirm(`Delete tag “${t.name}”?${used}`)) return;
    try {
      await http.delete(`/admin/tags/${t.id}`);
      setNotice({ tone: "success", text: "Tag deleted." });
      reload();
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof ApiError ? err.firstMessage : "Could not delete." });
    }
  }

  const fe = (k: string) => formError?.field(k);

  return (
    <>
      <PageMeta title="Tags | Anaya Collection Admin" description="Labels used to group and filter products." />
      <PageHeader title="Tags" description="Labels such as New Arrival or Winter 2026. Assign them from the product form." actions={<Button onClick={() => open()}>+ Add tag</Button>} />
      <div className="mb-4">
        <Notice tone={notice?.tone ?? "success"}>{notice?.text}</Notice>
      </div>
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Search tags" />
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle={values.q ? "No tags match your search." : "No tags yet."}>
          {data && (
            <DataTable
              caption="Tags"
              rows={data}
              rowKey={(t) => t.id}
              columns={[
                {
                  key: "name",
                  header: "Tag",
                  cell: (t) => (
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{t.name}</p>
                      <p className="text-theme-xs text-gray-500 dark:text-gray-400">{t.slug}</p>
                    </div>
                  ),
                },
                { key: "products", header: "Products", cell: (t) => t.products_count ?? 0 },
                {
                  key: "actions",
                  header: <span className="sr-only">Actions</span>,
                  align: "end",
                  cell: (t) => (
                    <div className="flex justify-end gap-3 text-sm font-medium">
                      <button type="button" className="text-brand-500 hover:underline" onClick={() => open(t)}>Edit</button>
                      <button type="button" className="text-gray-500 hover:text-error-600 dark:text-gray-400" onClick={() => void remove(t)}>Delete</button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </DataState>
      </Card>

      <Modal isOpen={draft !== null} onClose={() => setDraft(null)} className="m-4 max-w-lg p-6 sm:p-8">
        {draft && (
          <form onSubmit={save} noValidate className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit tag" : "New tag"}</h2>
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <TextInput
              label="Name"
              required
              autoFocus
              value={draft.name}
              error={fe("name")}
              maxLength={80}
              onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })}
            />
            <TextInput label="Slug" value={draft.slug} error={fe("slug")} maxLength={100} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} hint="Used in the store API filter (?tag=slug)" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save tag</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
