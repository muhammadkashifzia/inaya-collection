import { useState } from "react";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice, SelectInput, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import ImageUpload from "@/components/admin/ImageUpload";
import PageHeader from "@/components/admin/PageHeader";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { DesignCategory } from "@/types/api";

interface Draft {
  id?: number;
  name: string;
  slug: string;
  parent_id: string;
  description: string;
  display_type: string;
  image: { path: string | null; url: string | null };
  sort_order: string;
  is_active: boolean;
  meta_title: string;
  meta_description: string;
}

const blank: Draft = {
  name: "",
  slug: "",
  parent_id: "",
  description: "",
  display_type: "default",
  image: { path: null, url: null },
  sort_order: "0",
  is_active: true,
  meta_title: "",
  meta_description: "",
};

const DISPLAY_TYPE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "products", label: "Products" },
  { value: "subcategories", label: "Subcategories" },
  { value: "both", label: "Both" },
];

export default function DesignCategories() {
  const { data, error, loading, reload } = useApi(() => http.get<DesignCategory[]>("/admin/design-categories"), []);
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [confirmCat, setConfirmCat] = useState<DesignCategory | null>(null);

  const open = (c?: DesignCategory) => {
    setFormError(null);
    setDraft(
      c
        ? {
            id: c.id,
            name: c.name,
            slug: c.slug,
            parent_id: c.parent_id ? String(c.parent_id) : "",
            description: c.description ?? "",
            display_type: c.display_type ?? "default",
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
      slug: draft.slug || null,
      parent_id: draft.parent_id ? Number(draft.parent_id) : null,
      description: draft.description || null,
      display_type: draft.display_type,
      image: draft.image.path,
      sort_order: Number(draft.sort_order || 0),
      is_active: draft.is_active,
      meta_title: draft.meta_title || null,
      meta_description: draft.meta_description || null,
    };
    try {
      if (draft.id) await http.put(`/admin/design-categories/${draft.id}`, body);
      else await http.post("/admin/design-categories", body);
      setDraft(null);
      toast.success("Design category saved.");
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  function remove(c: DesignCategory) {
    setConfirmCat(c);
  }

  async function onConfirmRemove() {
    if (!confirmCat) return;
    try {
      await http.delete(`/admin/design-categories/${confirmCat.id}`);
      toast.success("Design category deleted.");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.firstMessage : "Could not delete.");
    } finally {
      setConfirmCat(null);
    }
  }

  const fe = (k: string) => formError?.field(k);

  return (
    <>
      <PageMeta title="Design Categories | Anaya Collection Admin" description="Manage design categories for products." />
      <PageHeader title="Design Categories" description="Organize products by design type." actions={<Button onClick={() => open()}>+ Add design category</Button>} />
      <Card bodyClassName="p-0">
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle="No design categories yet.">
          {data && (
            <DataTable
              caption="Design categories"
              rows={data}
              rowKey={(c) => c.id}
              columns={[
                {
                  key: "name",
                  header: "Design Category",
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
                { key: "display_type", header: "Display Type", cell: (c) => <span className="capitalize">{c.display_type}</span> },
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
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit design category" : "New design category"}</h2>
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Name" required value={draft.name} error={fe("name")} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
              <TextInput label="Slug" value={draft.slug} error={fe("slug")} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} hint={`/design/${draft.slug || "…"}`} />
              <SelectInput
                label="Parent category"
                value={draft.parent_id}
                onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
                placeholder="None (top level)"
                options={(data ?? []).filter((c) => c.id !== draft.id).map((c) => ({ value: String(c.id), label: c.name }))}
                error={fe("parent_id")}
              />
              <SelectInput
                label="Display type"
                value={draft.display_type}
                onChange={(e) => setDraft({ ...draft, display_type: e.target.value })}
                options={DISPLAY_TYPE_OPTIONS}
                error={fe("display_type")}
              />
              <TextAreaInput className="md:col-span-2" label="Description" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={2000} />
              <ImageUpload label="Thumbnail" endpoint="/admin/design-categories/image" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} error={fe("image")} aspect="aspect-square max-h-48" />
              <div className="space-y-4">
                <TextInput label="Sort order" type="number" min={0} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
                <Toggle label="Visible on the store" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
                <TextInput label="Meta title" value={draft.meta_title} onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })} maxLength={255} />
                <TextAreaInput label="Meta description" rows={2} value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} maxLength={500} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmDialog
        open={confirmCat !== null}
        title={`Delete "${confirmCat?.name}"?`}
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setConfirmCat(null)}
      />
    </>
  );
}
