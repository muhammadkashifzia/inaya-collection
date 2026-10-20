import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import { Notice, SelectInput, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import ImageUpload from "@/components/admin/ImageUpload";
import PageHeader from "@/components/admin/PageHeader";
import { DeleteAction, EditAction } from "@/components/admin/TableActions";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { toLocalInput } from "@/lib/format";
import type { Banner } from "@/types/api";

interface Draft {
  id?: number;
  placement: "hero" | "promo" | "collection_strip";
  title: string;
  subtitle: string;
  image: { path: string | null; url: string | null };
  mobile_image: { path: string | null; url: string | null };
  buttons: { label: string; href: string }[];
  sort_order: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const blank: Draft = { placement: "hero", title: "", subtitle: "", image: { path: null, url: null }, mobile_image: { path: null, url: null }, buttons: [], sort_order: "0", is_active: true, starts_at: "", ends_at: "" };

export default function Banners() {
  const { data, error, loading, reload } = useApi(() => http.get<Banner[]>("/admin/banners"), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const open = (b?: Banner) => {
    setFormError(null);
    setDraft(
      b
        ? {
            id: b.id,
            placement: b.placement,
            title: b.title,
            subtitle: b.subtitle ?? "",
            image: { path: b.image_path ?? null, url: b.image },
            mobile_image: { path: b.mobile_image_path ?? null, url: b.mobile_image },
            buttons: b.buttons ?? [],
            sort_order: String(b.sort_order),
            is_active: b.is_active ?? true,
            starts_at: toLocalInput(b.starts_at),
            ends_at: toLocalInput(b.ends_at),
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
      placement: draft.placement,
      title: draft.title,
      subtitle: draft.subtitle || null,
      image: draft.image.path,
      mobile_image: draft.mobile_image.path,
      buttons: draft.buttons.filter((b) => b.label && b.href),
      sort_order: Number(draft.sort_order || 0),
      is_active: draft.is_active,
      starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
    };
    try {
      if (draft.id) await http.put(`/admin/banners/${draft.id}`, body);
      else await http.post("/admin/banners", body);
      setDraft(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  async function remove(b: Banner) {
    if (!window.confirm(`Delete banner “${b.title}”?`)) return;
    await http.delete(`/admin/banners/${b.id}`);
    reload();
  }

  const fe = (k: string) => formError?.field(k);

  return (
    <>
      <PageMeta title="Banners | Anaya Collection Admin" description="Homepage hero and promo banners." />
      <PageHeader title="Banners" description="The first active hero banner is shown at the top of the homepage." actions={<Button onClick={() => open()}>+ New banner</Button>} />
      <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle="No banners yet.">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((b) => (
            <Card key={b.id} bodyClassName="p-0" className="overflow-hidden">
              <div className="relative aspect-video bg-ink-900">
                <img src={b.image} alt="" className="h-full w-full object-cover opacity-90" />
                <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 to-transparent p-4 text-white">
                  <span className="text-[10px] tracking-widest text-white/70 uppercase">{b.placement} · #{b.sort_order}</span>
                  <p className="font-display text-xl font-semibold">{b.title}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <ActiveBadge active={b.is_active ?? true} on="Live" off="Hidden" />
                <div className="flex gap-1">
                  <EditAction onClick={() => open(b)} />
                  <DeleteAction onClick={() => void remove(b)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DataState>

      <Modal isOpen={draft !== null} onClose={() => setDraft(null)} className="m-4 max-w-3xl p-6 sm:p-8">
        {draft && (
          <form onSubmit={save} noValidate className="max-h-[80vh] space-y-5 overflow-y-auto pe-1">
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit banner" : "New banner"}</h2>
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput className="md:col-span-2" label="Heading" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} error={fe("title")} maxLength={255} />
              <TextAreaInput className="md:col-span-2" label="Subheading" rows={2} value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} maxLength={500} />
              <ImageUpload label="Desktop image *" endpoint="/admin/banners/image" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} error={fe("image")} hint="Recommended 1920×800" />
              <ImageUpload label="Mobile image" endpoint="/admin/banners/image" value={draft.mobile_image} onChange={(mobile_image) => setDraft({ ...draft, mobile_image })} hint="Optional, portrait" aspect="aspect-3/4 max-h-48" />
              <SelectInput label="Placement" value={draft.placement} onChange={(e) => setDraft({ ...draft, placement: e.target.value as Draft["placement"] })} options={[{ value: "hero", label: "Homepage hero" }, { value: "promo", label: "Promo banner" }, { value: "collection_strip", label: "Collection strip" }]} />
              <TextInput label="Sort order" type="number" min={0} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
              <TextInput label="Show from" type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} />
              <TextInput label="Show until" type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} error={fe("ends_at")} />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Buttons</legend>
              {draft.buttons.map((btn, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label="Button label" className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900" value={btn.label} placeholder="Label" maxLength={40} onChange={(e) => setDraft({ ...draft, buttons: draft.buttons.map((b, bi) => (bi === i ? { ...b, label: e.target.value } : b)) })} />
                  <input aria-label="Button link" className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900" value={btn.href} placeholder="/collections/…" maxLength={255} onChange={(e) => setDraft({ ...draft, buttons: draft.buttons.map((b, bi) => (bi === i ? { ...b, href: e.target.value } : b)) })} />
                  <button type="button" aria-label="Remove button" className="px-2 text-gray-400 hover:text-error-500" onClick={() => setDraft({ ...draft, buttons: draft.buttons.filter((_, bi) => bi !== i) })}>×</button>
                </div>
              ))}
              {fe("buttons") && <p className="text-theme-xs text-error-600">{fe("buttons")}</p>}
              {draft.buttons.length < 6 && (
                <button type="button" className="text-sm font-medium text-brand-500" onClick={() => setDraft({ ...draft, buttons: [...draft.buttons, { label: "", href: "" }] })}>+ Add button</button>
              )}
            </fieldset>
            <Toggle label="Active" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save banner</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
