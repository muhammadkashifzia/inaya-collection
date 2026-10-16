import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice, SelectInput, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import ImageUpload from "@/components/admin/ImageUpload";
import PageHeader from "@/components/admin/PageHeader";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Category } from "@/types/api";

interface Draft {
  id?: number;
  name: string;
  short_name: string;
  slug: string;
  parent_id: string;
  description: string;
  image: { path: string | null; url: string | null };
  sort_order: string;
  is_active: boolean;
  meta_title: string;
  meta_description: string;
}

const blank: Draft = { name: "", short_name: "", slug: "", parent_id: "", description: "", image: { path: null, url: null }, sort_order: "0", is_active: true, meta_title: "", meta_description: "" };

export default function Categories() {
  const { data, error, loading, reload } = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const open = (c?: Category) => {
    setFormError(null);
    setDraft(
      c
        ? {
            id: c.id,
            name: c.name,
            short_name: c.short_name === c.name ? "" : c.short_name,
            slug: c.slug,
            parent_id: c.parent_id ? String(c.parent_id) : "",
            description: c.description ?? "",
            image: { path: c.image_path ?? null, url: c.image },
            sort_order: String(c.sort_order),
            is_active: c.is_active,
            meta_title: c.meta_title ?? "",
            meta_description: c.meta_description ?? "",
          }
        : blank,
    );
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    const body = {
      name: draft.name,
      short_name: draft.short_name || null,
      slug: draft.slug || null,
      parent_id: draft.parent_id ? Number(draft.parent_id) : null,
      description: draft.description || null,
      image: draft.image.path,
      sort_order: Number(draft.sort_order || 0),
      is_active: draft.is_active,
      meta_title: draft.meta_title || null,
      meta_description: draft.meta_description || null,
    };
    try {
      if (draft.id) await http.put(`/admin/categories/${draft.id}`, body);
      else await http.post("/admin/categories", body);
      setDraft(null);
      setNotice({ tone: "success", text: "Category saved." });
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Category) {
    if (!window.confirm(`Delete “${c.name}”?`)) return;
    try {
      await http.delete(`/admin/categories/${c.id}`);
      setNotice({ tone: "success", text: "Category deleted." });
      reload();
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof ApiError ? err.firstMessage : "Could not delete." });
    }
  }

  const fe = (k: string) => formError?.field(k);

  return (
    <>
      <PageMeta title="Categories | Inaya Collection Admin" description="Manage collections and subcategories." />
      <PageHeader title="Categories" description="Collections shown in the storefront menu and homepage." actions={<Button onClick={() => open()}>+ Add category</Button>} />
      <div className="mb-4">
        <Notice tone={notice?.tone ?? "success"}>{notice?.text}</Notice>
      </div>
      <Card bodyClassName="p-0">
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle="No categories yet.">
          {data && (
            <DataTable
              caption="Categories"
              rows={data}
              rowKey={(c) => c.id}
              columns={[
                {
                  key: "name",
                  header: "Category",
                  cell: (c) => (
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">{c.image && <img src={c.image} alt="" className="h-full w-full object-cover" />}</div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {c.parent && <span className="text-gray-400">{c.parent.name} › </span>}
                          {c.name}
                        </p>
                        <p className="text-theme-xs text-gray-500">/{c.slug}</p>
                      </div>
                    </div>
                  ),
                },
                { key: "products", header: "Products", cell: (c) => c.products_count ?? 0 },
                { key: "order", header: "Order", cell: (c) => c.sort_order },
                { key: "status", header: "Status", cell: (c) => <ActiveBadge active={c.is_active} on="Visible" off="Hidden" /> },
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
          )}
        </DataState>
      </Card>

      <Modal isOpen={draft !== null} onClose={() => setDraft(null)} className="m-4 max-w-2xl p-6 sm:p-8">
        {draft && (
          <form onSubmit={save} noValidate className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit category" : "New category"}</h2>
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Name" required value={draft.name} error={fe("name")} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
              <TextInput label="Short name (menu)" value={draft.short_name} onChange={(e) => setDraft({ ...draft, short_name: e.target.value })} maxLength={60} hint="e.g. 3 PC Khaddar" />
              <TextInput label="Slug" value={draft.slug} error={fe("slug")} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} hint={`/collections/${draft.slug || "…"}`} />
              <SelectInput
                label="Parent category"
                value={draft.parent_id}
                onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
                placeholder="None (top level)"
                options={(data ?? []).filter((c) => c.id !== draft.id).map((c) => ({ value: String(c.id), label: c.name }))}
                error={fe("parent_id")}
              />
              <TextAreaInput className="md:col-span-2" label="Description" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={2000} />
              <ImageUpload label="Image" endpoint="/admin/categories/image" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} error={fe("image")} aspect="aspect-3/4 max-h-60" />
              <div className="space-y-4">
                <TextInput label="Sort order" type="number" min={0} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
                <Toggle label="Visible on the store" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
                <TextInput label="Meta title" value={draft.meta_title} onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })} maxLength={255} />
                <TextAreaInput label="Meta description" rows={2} value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} maxLength={500} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save category</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
