import { useCallback, useMemo, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DataState from "@/components/admin/DataState";
import { Notice, SelectInput, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import ImageUpload from "@/components/admin/ImageUpload";
import PageHeader from "@/components/admin/PageHeader";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Category } from "@/types/api";

/* ── form draft ────────────────────────────────────────────────── */

interface Draft {
  id?: number;
  name: string;
  short_name: string;
  slug: string;
  parent_id: string;
  description: string;
  image: { path: string | null; url: string | null };
  is_active: boolean;
}

const blank: Draft = {
  name: "",
  short_name: "",
  slug: "",
  parent_id: "",
  description: "",
  image: { path: null, url: null },
  is_active: true,
};

/* ── drag item type ────────────────────────────────────────────── */

const ROW_TYPE = "CATEGORY_ROW";

interface DragItem {
  index: number;
  id: number;
}

function DraggableRow({ row, index, moveRow, children }: { row: Category; index: number; moveRow: (from: number, to: number) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ROW_TYPE,
    item: (): DragItem => ({ index, id: row.id }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop<DragItem>({
    accept: ROW_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  preview(drop(ref));

  return (
    <tr ref={ref} className={`group hover:bg-gray-50/60 dark:hover:bg-white/2 ${isDragging ? "opacity-40" : ""}`}>
      <td className="w-8 px-2 py-3 text-center">
        <span ref={(node) => { drag(node); }} className="inline-flex cursor-grab text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </span>
      </td>
      {children}
    </tr>
  );
}

/* ── page component ────────────────────────────────────────────── */

export default function Categories() {
  const { data, error, loading, reload } = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const toast = useToast();

  /* form state */
  const [draft, setDraft] = useState<Draft>({ ...blank });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  /* search & delete */
  const [search, setSearch] = useState("");
  const [confirmCat, setConfirmCat] = useState<Category | null>(null);

  /* mobile accordion for form */
  const [formOpen, setFormOpen] = useState(false);

  /* local row order for drag-and-drop */
  const [localOrder, setLocalOrder] = useState<Category[] | null>(null);

  const isEditing = Boolean(draft.id);

  /* ── filtered rows ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const source = localOrder ?? data;
    if (!source) return [];
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
    );
  }, [data, localOrder, search]);

  const isSearching = search.trim().length > 0;

  /* ── drag reorder ──────────────────────────────────────────── */
  const moveRow = useCallback(
    (from: number, to: number) => {
      const source = localOrder ?? data;
      if (!source) return;
      const updated = [...source];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      setLocalOrder(updated);
    },
    [data, localOrder],
  );

  async function saveOrder() {
    if (!localOrder) return;
    try {
      const order = localOrder.map((c, i) => ({ id: c.id, sort_order: i }));
      await http.post("/admin/categories/reorder", { order });
      toast.success("Sort order saved.");
      setLocalOrder(null);
      reload();
    } catch {
      toast.error("Could not save sort order.");
    }
  }

  /* ── form helpers ──────────────────────────────────────────── */
  function resetForm() {
    setDraft({ ...blank });
    setFormError(null);
  }

  function startEdit(c: Category) {
    setFormError(null);
    setDraft({
      id: c.id,
      name: c.name,
      short_name: c.short_name === c.name ? "" : c.short_name,
      slug: c.slug,
      parent_id: c.parent_id ? String(c.parent_id) : "",
      description: c.description ?? "",
      image: { path: c.image_path ?? null, url: c.image },
      is_active: c.is_active,
    });
    setFormOpen(true);
    document.getElementById("category-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const body = {
      name: draft.name,
      short_name: draft.short_name || null,
      slug: draft.slug || null,
      parent_id: draft.parent_id ? Number(draft.parent_id) : null,
      description: draft.description || null,
      image: draft.image.path,
      is_active: draft.is_active,
    };
    try {
      if (draft.id) await http.put(`/admin/categories/${draft.id}`, body);
      else await http.post("/admin/categories", body);
      toast.success(draft.id ? "Category updated." : "Category created.");
      resetForm();
      setLocalOrder(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmRemove() {
    if (!confirmCat) return;
    try {
      await http.delete(`/admin/categories/${confirmCat.id}`);
      toast.success("Category deleted.");
      if (draft.id === confirmCat.id) resetForm();
      setLocalOrder(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.firstMessage : "Could not delete.");
    } finally {
      setConfirmCat(null);
    }
  }

  const fe = (k: string) => formError?.field(k);

  return (
    <DndProvider backend={HTML5Backend}>
      <PageMeta title="Categories | Anaya Collection Admin" description="Manage collections and subcategories." />
      <PageHeader title="Categories" description="Collections shown in the storefront menu and homepage." />

      {/* ── Split layout: form (left) + table (right) ── */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        {/* ──────────── LEFT: Add / Edit Form ──────────── */}
        <div id="category-form">
          <Card>
            {/* Accordion toggle – mobile only */}
            <button
              type="button"
              onClick={() => setFormOpen(!formOpen)}
              className="flex w-full items-center justify-between lg:hidden"
            >
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                {isEditing ? "Edit category" : "Add new category"}
              </h2>
              <svg
                className={`size-5 shrink-0 text-gray-500 transition-transform duration-200 ${formOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Form body: always visible on lg+, accordion on mobile */}
            <div className={`${formOpen ? "mt-4 block" : "hidden"} lg:!block`}>
              <form onSubmit={save} noValidate className="space-y-4">
                {/* Desktop-only heading (hidden on mobile since the accordion button shows it) */}
                <h2 className="hidden text-base font-semibold text-gray-800 dark:text-white/90 lg:block">
                  {isEditing ? "Edit category" : "Add new category"}
                </h2>

              <Notice tone="error">
                {formError && !Object.keys(formError.errors).length ? formError.message : null}
              </Notice>

              <TextInput
                label="Name"
                required
                value={draft.name}
                error={fe("name")}
                maxLength={120}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    name: e.target.value,
                    slug: draft.id ? draft.slug : slugify(e.target.value),
                  })
                }
              />

              <TextInput
                label="Short name (menu)"
                value={draft.short_name}
                onChange={(e) => setDraft({ ...draft, short_name: e.target.value })}
                maxLength={60}
                hint="e.g. 3 PC Khaddar"
              />

              <TextInput
                label="Slug"
                value={draft.slug}
                error={fe("slug")}
                onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                hint={`/collections/${draft.slug || "…"}`}
              />

              <SelectInput
                label="Parent category"
                value={draft.parent_id}
                onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
                placeholder="None (top level)"
                options={(data ?? [])
                  .filter((c) => c.id !== draft.id)
                  .map((c) => ({ value: String(c.id), label: c.name }))}
                error={fe("parent_id")}
              />

              <TextAreaInput
                label="Description"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                maxLength={2000}
              />

              <ImageUpload
                label="Thumbnail"
                endpoint="/admin/categories/image"
                value={draft.image}
                onChange={(image) => setDraft({ ...draft, image })}
                error={fe("image")}
              />

              <Toggle
                label="Visible on the store"
                checked={draft.is_active}
                onChange={(v) => setDraft({ ...draft, is_active: v })}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={busy}>
                  {isEditing ? "Update category" : "Add new category"}
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
              </form>
            </div>
          </Card>
        </div>

        {/* ──────────── RIGHT: Table ──────────── */}
        <Card bodyClassName="p-0">
          {/* Search bar + save order */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {data ? `${filtered.length} ${filtered.length === 1 ? "item" : "items"}` : ""}
              </p>
              {localOrder && (
                <Button size="sm" onClick={() => void saveOrder()}>
                  Save order
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Search categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
          </div>

          <DataState
            loading={loading}
            error={error}
            onRetry={reload}
            hasData={Boolean(data)}
            empty={data?.length === 0}
            emptyTitle="No categories yet."
          >
            {data && (
              <>
                {/* ── Mobile card view ── */}
                <div className="space-y-3 p-4 md:hidden" role="list" aria-label="Categories">
                  {filtered.map((c) => (
                    <div key={c.id} role="listitem" className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                          {c.image ? (
                            <img src={c.image} alt="" className="h-full w-full object-cover object-top" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-gray-800 dark:text-white/90">
                              {c.parent && <span className="text-gray-400">{c.parent.name} › </span>}
                              {c.name}
                            </p>
                            <ActiveBadge active={c.is_active} on="Visible" off="Hidden" />
                          </div>
                          <p className="text-theme-xs text-gray-500">/{c.slug}</p>
                        </div>
                      </div>
                      {c.description && <p className="mb-3 line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">{c.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                          <span className="me-1 font-medium text-brand-500">{c.products_count ?? 0}</span> products
                        </span>
                        <div className="flex gap-3 text-sm font-medium">
                          <button type="button" className="text-brand-500 hover:underline" onClick={() => startEdit(c)}>Edit</button>
                          <button type="button" className="text-error-500 hover:underline" onClick={() => setConfirmCat(c)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Desktop table view ── */}
                <div className="hidden overflow-x-auto md:block">
                  <Table className="text-sm">
                    <caption className="sr-only">Categories</caption>
                    <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                      <TableRow>
                        <TableCell isHeader className="w-8 px-2 py-3" />
                        <TableCell isHeader className="w-16 px-4 py-3 text-theme-sm font-medium tracking-wide whitespace-nowrap text-gray-500 dark:text-gray-400">Image</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-theme-sm font-medium tracking-wide whitespace-nowrap text-gray-500 dark:text-gray-400">Name</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-theme-sm font-medium tracking-wide whitespace-nowrap text-gray-500 dark:text-gray-400">Description</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-theme-sm font-medium tracking-wide whitespace-nowrap text-gray-500 dark:text-gray-400">Slug</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-theme-sm font-medium tracking-wide whitespace-nowrap text-gray-500 dark:text-gray-400">Status</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-end text-theme-sm font-medium tracking-wide whitespace-nowrap text-gray-500 dark:text-gray-400">Count</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filtered.map((c, i) => (
                        <DraggableRow key={c.id} row={c} index={i} moveRow={isSearching ? () => {} : moveRow}>
                          <TableCell className="w-16 px-4 py-3">
                            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                              {c.image ? (
                                <img src={c.image} alt="" className="h-full w-full object-cover object-top" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div>
                              <button
                                type="button"
                                className="text-start text-theme-sm font-medium text-brand-500 hover:underline"
                                onClick={() => startEdit(c)}
                              >
                                {c.parent && <span className="text-gray-400">{c.parent.name} › </span>}
                                {c.name}
                              </button>
                              <div className="invisible mt-1 flex gap-1 text-theme-xs font-medium group-hover:visible">
                                <button type="button" className="text-brand-500 hover:underline" onClick={() => startEdit(c)}>
                                  Edit
                                </button>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <button type="button" className="text-error-500 hover:underline" onClick={() => setConfirmCat(c)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="line-clamp-2 max-w-xs text-[13px] text-gray-500 dark:text-gray-400">
                              {c.description || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="text-[13px] text-gray-500 dark:text-gray-400">{c.slug}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <ActiveBadge active={c.is_active} on="Visible" off="Hidden" />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-end">
                            <span className="font-medium text-brand-500">{c.products_count ?? 0}</span>
                          </TableCell>
                        </DraggableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </DataState>

          {/* Footer note */}
          {data && data.length > 0 && (
            <p className="border-t border-gray-100 px-4 py-3 text-theme-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
              Deleting a category does not delete its products. Products are moved to the default category.
            </p>
          )}
        </Card>
      </div>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={confirmCat !== null}
        title={`Delete "${confirmCat?.name}"?`}
        message="This cannot be undone. Products in this category will be uncategorized."
        confirmLabel="Delete"
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setConfirmCat(null)}
      />
    </DndProvider>
  );
}
