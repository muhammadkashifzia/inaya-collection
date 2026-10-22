import { useRef, useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import { Notice, SelectInput, TextInput, Toggle } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import { DeleteAction, EditAction } from "@/components/admin/TableActions";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Drawer } from "@/components/ui/drawer";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { PlusIcon, TrashBinIcon, UploadIcon } from "@/icons";
import type { Category, HomeSection, HomeSectionType } from "@/types/api";

const TYPES: { value: HomeSectionType; label: string; hint: string }[] = [
  { value: "category_grid", label: "Shop by collection (grid)", hint: "Tiles for every top-level category" },
  { value: "category_tabs", label: "Collection tabs", hint: "Tabs per category with N products each" },
  { value: "featured", label: "Featured products", hint: "Products marked as featured" },
  { value: "best_sellers", label: "Best sellers", hint: "Most units sold" },
  { value: "latest", label: "New arrivals", hint: "Most recently published" },
  { value: "discounted", label: "On sale", hint: "Products with a sale price" },
  { value: "category", label: "Single category", hint: "Products from one category" },
  { value: "banner_image", label: "Banner images", hint: "Horizontal strip of banner images with text overlay" },
  { value: "reviews", label: "Reviews (not stored yet)", hint: "Hidden on the storefront until reviews exist" },
];

const NO_PRODUCT_LIMIT: HomeSectionType[] = ["category_grid", "reviews", "banner_image"];

interface SlideDraft {
  image: string;
  image_url: string;
  text: string;
  link: string;
}

interface Draft {
  id?: number;
  type: HomeSectionType;
  title: string;
  slides: SlideDraft[];
  category_id: string;
  product_limit: string;
  sort_order: string;
  is_active: boolean;
}

const emptySlide = (): SlideDraft => ({ image: "", image_url: "", text: "", link: "" });

const emptyDraft = (sortOrder: number): Draft => ({
  type: "featured",
  title: "",
  slides: [emptySlide()],
  category_id: "",
  product_limit: "8",
  sort_order: String(sortOrder),
  is_active: true,
});

const toDraft = (s: HomeSection): Draft => ({
  id: s.id,
  type: s.type,
  title: s.title,
  slides: s.slides?.map((sl) => ({
    image: sl.image ?? "",
    image_url: sl.image_url ?? "",
    text: sl.text ?? "",
    link: sl.link ?? "",
  })) ?? [emptySlide()],
  category_id: s.category_id ? String(s.category_id) : "",
  product_limit: String(s.product_limit),
  sort_order: String(s.sort_order),
  is_active: s.is_active,
});

export default function HomeSections() {
  const { data, error, loading, reload, setData } = useApi(() => http.get<HomeSection[]>("/admin/home-sections"), []);
  const categories = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetIndex = useRef<number>(0);

  const toBody = (s: Draft | HomeSection) => ({
    type: s.type,
    title: s.title,
    slides: s.type === "banner_image" && "slides" in s && Array.isArray(s.slides)
      ? s.slides.filter((sl) => sl.image).map((sl) => ({ image: sl.image, text: sl.text || null, link: sl.link || null }))
      : null,
    category_id: s.type === "category" ? Number(s.category_id) || null : null,
    product_limit: Number(s.product_limit || 8),
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

  async function move(index: number, dir: -1 | 1) {
    if (!data) return;
    const list = [...data];
    const other = index + dir;
    if (other < 0 || other >= list.length) return;
    [list[index], list[other]] = [list[other], list[index]];
    const renumbered = list.map((s, i) => ({ ...s, sort_order: i }));
    setData(renumbered);
    await Promise.all([renumbered[index], renumbered[other]].map((s) => http.put(`/admin/home-sections/${s.id}`, toBody(s))));
  }

  async function remove(s: HomeSection) {
    if (!window.confirm(`Remove "${s.title}" from the homepage?`)) return;
    await http.delete(`/admin/home-sections/${s.id}`);
    reload();
  }

  async function uploadSlideImage(file: File, index: number) {
    setUploadingIndex(index);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await http.post<{ path: string; url: string }>("/admin/banners/image", form);
      setDraft((prev) => {
        if (!prev) return prev;
        const slides = [...prev.slides];
        slides[index] = { ...slides[index], image: res.path, image_url: res.url };
        return { ...prev, slides };
      });
    } catch {
      // handled silently
    } finally {
      setUploadingIndex(null);
    }
  }

  function updateSlide(index: number, field: keyof SlideDraft, value: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const slides = [...prev.slides];
      slides[index] = { ...slides[index], [field]: value };
      return { ...prev, slides };
    });
  }

  function removeSlide(index: number) {
    setDraft((prev) => {
      if (!prev || prev.slides.length <= 1) return prev;
      return { ...prev, slides: prev.slides.filter((_, i) => i !== index) };
    });
  }

  function addSlide() {
    setDraft((prev) => prev ? { ...prev, slides: [...prev.slides, emptySlide()] } : prev);
  }

  return (
    <>
      <PageMeta title="Homepage sections | Anaya Collection Admin" description="Choose what appears on the homepage." />
      <PageHeader
        title="Homepage sections"
        description="Sections appear on the homepage in this order, below the hero banner."
        actions={<Button onClick={() => { setFormError(null); setDraft(emptyDraft(data?.length ?? 0)); }}>+ Add section</Button>}
      />
      <Card bodyClassName="p-0">
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle="The homepage has no sections yet.">
          <ol className="divide-y divide-gray-100 dark:divide-gray-800">
            {data?.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="flex flex-col">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)} className="text-gray-400 hover:text-ink-900 disabled:opacity-20 dark:hover:text-white">{"\u25B2"}</button>
                  <button type="button" aria-label="Move down" disabled={i === (data?.length ?? 0) - 1} onClick={() => void move(i, 1)} className="text-gray-400 hover:text-ink-900 disabled:opacity-20 dark:hover:text-white">{"\u25BC"}</button>
                </div>
                {/* Thumbnails for banner_image slides */}
                {s.type === "banner_image" && s.slides && s.slides.length > 0 && (
                  <div className="flex -space-x-2">
                    {s.slides.slice(0, 4).map((sl, j) => (
                      <div key={j} className="size-10 shrink-0 overflow-hidden rounded-lg border-2 border-white bg-gray-100 dark:border-gray-800 dark:bg-white/5">
                        {sl.image_url && <img src={sl.image_url} alt="" className="h-full w-full object-cover object-top" />}
                      </div>
                    ))}
                    {s.slides.length > 4 && (
                      <div className="flex size-10 items-center justify-center rounded-lg border-2 border-white bg-gray-100 text-theme-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-white/5">
                        +{s.slides.length - 4}
                      </div>
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 dark:text-white/90">{s.title}</p>
                  <p className="text-theme-xs text-gray-500">
                    {TYPES.find((t) => t.value === s.type)?.label}
                    {s.type === "banner_image" && s.slides ? ` \u00B7 ${s.slides.length} banners` : null}
                    {s.category && ` \u00B7 ${s.category.name}`}
                    {!NO_PRODUCT_LIMIT.includes(s.type) && ` \u00B7 ${s.product_limit} products`}
                  </p>
                </div>
                <ActiveBadge active={s.is_active} on="Shown" off="Hidden" />
                <div className="flex gap-1">
                  <EditAction onClick={() => { setFormError(null); setDraft(toDraft(s)); }} />
                  <DeleteAction onClick={() => void remove(s)} />
                </div>
              </li>
            ))}
          </ol>
        </DataState>
      </Card>

      <Drawer isOpen={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? "Edit section" : "Add section"}>
        {draft && (
          <form onSubmit={save} noValidate className="space-y-5 p-6">
            <Notice tone="error">{formError && !Object.keys(formError.errors).length ? formError.message : null}</Notice>
            <SelectInput label="Section type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as HomeSectionType })} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} hint={TYPES.find((t) => t.value === draft.type)?.hint} />
            <TextInput label="Heading" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} error={formError?.field("title")} maxLength={255} />

            {/* ── Banner image slides ── */}
            {draft.type === "banner_image" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Banner slides <span className="text-error-500">*</span>
                  </label>
                  <button type="button" onClick={addSlide} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20">
                    <PlusIcon className="size-4" /> Add slide
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.slides.map((slide, idx) => (
                    <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.02]">
                      {/* Slide header */}
                      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 dark:border-gray-700/50 dark:bg-white/[0.02]">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Slide {idx + 1}</span>
                        {draft.slides.length > 1 && (
                          <button type="button" onClick={() => removeSlide(idx)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-theme-xs font-medium text-error-500 transition-colors hover:bg-error-50 dark:hover:bg-error-500/10">
                            <TrashBinIcon className="size-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="p-4">
                        {/* Image preview or upload */}
                        {slide.image_url ? (
                          <div className="group relative mb-4 overflow-hidden rounded-lg">
                            <img src={slide.image_url} alt="" className="aspect-[5/2] w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => { uploadTargetIndex.current = idx; imageInputRef.current?.click(); }}
                                className="rounded-lg bg-white/90 px-3 py-1.5 text-theme-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => { updateSlide(idx, "image", ""); updateSlide(idx, "image_url", ""); }}
                                className="rounded-lg bg-error-500/90 px-3 py-1.5 text-theme-xs font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-error-500"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { uploadTargetIndex.current = idx; imageInputRef.current?.click(); }}
                            disabled={uploadingIndex === idx}
                            className="mb-4 flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 transition-colors hover:border-brand-400 hover:bg-brand-50/30 disabled:opacity-50 dark:border-gray-600 dark:hover:border-brand-400 dark:hover:bg-brand-500/5"
                          >
                            {uploadingIndex === idx ? (
                              <span className="size-6 animate-spin rounded-full border-2 border-brand-500 border-e-transparent" />
                            ) : (
                              <UploadIcon className="size-6 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {uploadingIndex === idx ? "Uploading..." : "Click to upload banner image"}
                            </span>
                            <span className="text-theme-xs text-gray-400 dark:text-gray-500">
                              JPG, PNG or WebP &middot; Recommended 1200&times;400
                            </span>
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <TextInput label="Overlay text" value={slide.text} onChange={(e) => updateSlide(idx, "text", e.target.value)} maxLength={255} placeholder="e.g. Silk" />
                          <TextInput label="Link" value={slide.link} onChange={(e) => updateSlide(idx, "link", e.target.value)} maxLength={255} placeholder="/collections/silk" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadSlideImage(file, uploadTargetIndex.current);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                />
                {formError?.field("slides") && (
                  <p className="text-sm text-error-500">{formError.field("slides")}</p>
                )}
              </div>
            )}

            {draft.type === "category" && (
              <SelectInput label="Category" required value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })} placeholder="Choose\u2026" options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))} error={formError?.field("category_id")} />
            )}
            {!NO_PRODUCT_LIMIT.includes(draft.type) && (
              <TextInput label="Products to show" type="number" min={1} max={24} value={draft.product_limit} onChange={(e) => setDraft({ ...draft, product_limit: e.target.value })} error={formError?.field("product_limit")} />
            )}
            <Toggle label="Show on homepage" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
            <div className="sticky bottom-0 -mx-6 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" loading={busy}>Save section</Button>
              </div>
            </div>
          </form>
        )}
      </Drawer>
    </>
  );
}
