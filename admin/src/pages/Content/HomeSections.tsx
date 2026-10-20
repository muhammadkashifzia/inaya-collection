import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import ImageBannerItemsEditor, { emptyImageBannerItem, type ImageBannerItemDraft } from "@/components/admin/ImageBannerItemsEditor";
import { Notice, SelectInput, TextInput, Toggle } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import type { Category, HomeSection, HomeSectionType } from "@/types/api";

const TYPES: { value: HomeSectionType; label: string; hint: string }[] = [
  { value: "category_grid", label: "Shop by collection (grid)", hint: "Tiles for every top-level category" },
  { value: "category_tabs", label: "Collection tabs", hint: "Tabs per category with N products each" },
  { value: "featured", label: "Featured products", hint: "Products marked as featured" },
  { value: "best_sellers", label: "Best sellers", hint: "Most units sold" },
  { value: "latest", label: "New arrivals", hint: "Most recently published" },
  { value: "discounted", label: "On sale", hint: "Products with a sale price" },
  { value: "category", label: "Single category", hint: "Products from one category" },
  { value: "image_banners", label: "Image banners (cards)", hint: "A row of cards with a background image and your text on top, e.g. Silk, Lawn, Velvet" },
  { value: "reviews", label: "Reviews (not stored yet)", hint: "Hidden on the storefront until reviews exist" },
];

/** Section types that don't show a list of products. */
const NO_PRODUCTS: HomeSectionType[] = ["category_grid", "reviews", "image_banners"];

interface Draft {
  id?: number;
  type: HomeSectionType;
  title: string;
  category_id: string;
  product_limit: string;
  items: ImageBannerItemDraft[];
  sort_order: string;
  is_active: boolean;
}

const fromSection = (s: HomeSection): Draft => ({
  id: s.id,
  type: s.type,
  title: s.title,
  category_id: s.category_id ? String(s.category_id) : "",
  product_limit: String(s.product_limit),
  items: (s.items ?? []).map((item) => ({
    image: { path: item.image_path, url: item.image },
    title: item.title ?? "",
    subtitle: item.subtitle ?? "",
    href: item.href ?? "",
    align: item.align === "left" ? "left" : "center",
  })),
  sort_order: String(s.sort_order),
  is_active: s.is_active,
});

export default function HomeSections() {
  const { data, error, loading, reload, setData } = useApi(() => http.get<HomeSection[]>("/admin/home-sections"), []);
  const categories = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const toBody = (s: Draft) => ({
    type: s.type,
    title: s.title,
    category_id: s.type === "category" ? Number(s.category_id) || null : null,
    product_limit: Number(s.product_limit || 8),
    items:
      s.type === "image_banners"
        ? s.items.map((item) => ({
            image: item.image.path,
            title: item.title.trim() || null,
            subtitle: item.subtitle.trim() || null,
            href: item.href.trim() || null,
            align: item.align,
          }))
        : null,
    sort_order: Number(s.sort_order || 0),
    is_active: s.is_active,
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    try {
      if (draft.id) await http.put(`/admin/home-sections/${draft.id}`, toBody(draft));
      else await http.post("/admin/home-sections", toBody(draft));
      setDraft(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  /** Swap sort order with the neighbour and persist both. */
  async function move(index: number, dir: -1 | 1) {
    if (!data) return;
    const list = [...data];
    const other = index + dir;
    if (other < 0 || other >= list.length) return;
    [list[index], list[other]] = [list[other], list[index]];
    const renumbered = list.map((s, i) => ({ ...s, sort_order: i }));
    setData(renumbered);
    await Promise.all([renumbered[index], renumbered[other]].map((s) => http.put(`/admin/home-sections/${s.id}`, toBody(fromSection(s)))));
  }

  async function remove(s: HomeSection) {
    if (!window.confirm(`Remove “${s.title}” from the homepage?`)) return;
    await http.delete(`/admin/home-sections/${s.id}`);
    reload();
  }

  return (
    <>
      <PageMeta title="Homepage sections | Anaya Collection Admin" description="Choose what appears on the homepage." />
      <PageHeader
        title="Homepage sections"
        description="Sections appear on the homepage in this order, below the hero banner."
        actions={<Button onClick={() => { setFormError(null); setDraft({ type: "featured", title: "", category_id: "", product_limit: "8", items: [], sort_order: String(data?.length ?? 0), is_active: true }); }}>+ Add section</Button>}
      />
      <Card bodyClassName="p-0">
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle="The homepage has no sections yet.">
          <ol className="divide-y divide-gray-100 dark:divide-gray-800">
            {data?.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="flex flex-col">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)} className="text-gray-400 hover:text-ink-900 disabled:opacity-20 dark:hover:text-white">▲</button>
                  <button type="button" aria-label="Move down" disabled={i === (data?.length ?? 0) - 1} onClick={() => void move(i, 1)} className="text-gray-400 hover:text-ink-900 disabled:opacity-20 dark:hover:text-white">▼</button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 dark:text-white/90">{s.title || <span className="italic text-gray-400">No heading</span>}</p>
                  <p className="text-theme-xs text-gray-500">
                    {TYPES.find((t) => t.value === s.type)?.label}
                    {s.category && ` · ${s.category.name}`}
                    {s.type === "image_banners" && ` · ${s.items?.length ?? 0} cards`}
                    {!NO_PRODUCTS.includes(s.type) && ` · ${s.product_limit} products`}
                  </p>
                </div>
                <ActiveBadge active={s.is_active} on="Shown" off="Hidden" />
                <div className="flex gap-3 text-sm font-medium">
                  <button type="button" className="text-brand-500 hover:underline" onClick={() => { setFormError(null); setDraft(fromSection(s)); }}>Edit</button>
                  <button type="button" className="text-gray-500 hover:text-error-600" onClick={() => void remove(s)}>Remove</button>
                </div>
              </li>
            ))}
          </ol>
        </DataState>
      </Card>

      <Modal isOpen={draft !== null} onClose={() => setDraft(null)} className={`m-4 p-6 sm:p-8 ${draft?.type === "image_banners" ? "max-w-3xl" : "max-w-lg"}`}>
        {draft && (
          <form onSubmit={save} noValidate className="custom-scrollbar max-h-[80vh] space-y-5 overflow-y-auto pe-1">
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit section" : "Add section"}</h2>
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <SelectInput
              label="Section type"
              value={draft.type}
              onChange={(e) => {
                const type = e.target.value as HomeSectionType;
                // Start a new image banner section with one empty card to fill in.
                setDraft({ ...draft, type, items: type === "image_banners" && draft.items.length === 0 ? [emptyImageBannerItem()] : draft.items });
              }} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} hint={TYPES.find((t) => t.value === draft.type)?.hint} />
            <TextInput label={draft.type === "image_banners" ? "Heading (optional)" : "Heading"} required={draft.type !== "image_banners"} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} error={formError?.field("title")} maxLength={255} />
            {draft.type === "category" && (
              <SelectInput label="Category" required value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })} placeholder="Choose…" options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))} error={formError?.field("category_id")} />
            )}
            {!NO_PRODUCTS.includes(draft.type) && (
              <TextInput label="Products to show" type="number" min={1} max={24} value={draft.product_limit} onChange={(e) => setDraft({ ...draft, product_limit: e.target.value })} error={formError?.field("product_limit")} />
            )}
            {draft.type === "image_banners" && (
              <ImageBannerItemsEditor
                items={draft.items}
                onChange={(items) => setDraft({ ...draft, items })}
                error={formError}
              />
            )}
            <Toggle label="Show on homepage" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save section</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
