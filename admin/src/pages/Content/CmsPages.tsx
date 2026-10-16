import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import { Notice, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { ApiError, http, STOREFRONT_URL } from "@/lib/api";
import { date, slugify } from "@/lib/format";
import type { CmsPage } from "@/types/api";

interface Draft {
  id?: number;
  slug: string;
  title: string;
  sections: { heading: string; body: string }[];
  is_published: boolean;
  meta_title: string;
  meta_description: string;
}

/** Plain-text CMS pages (About, Policies, FAQ…). Bodies are rendered escaped. */
export default function CmsPages() {
  const { data, error, loading, reload } = useApi(() => http.get<CmsPage[]>("/admin/pages"), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const open = (p?: CmsPage) => {
    setFormError(null);
    setDraft(
      p
        ? { id: p.id, slug: p.slug, title: p.title, sections: p.sections.map((s) => ({ heading: s.heading ?? "", body: s.body })), is_published: p.is_published, meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "" }
        : { slug: "", title: "", sections: [{ heading: "", body: "" }], is_published: true, meta_title: "", meta_description: "" },
    );
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    const body = {
      slug: draft.slug,
      title: draft.title,
      sections: draft.sections.filter((s) => s.body.trim()).map((s) => ({ heading: s.heading || null, body: s.body })),
      is_published: draft.is_published,
      meta_title: draft.meta_title || null,
      meta_description: draft.meta_description || null,
    };
    try {
      if (draft.id) await http.put(`/admin/pages/${draft.id}`, body);
      else await http.post("/admin/pages", body);
      setDraft(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: CmsPage) {
    if (!window.confirm(`Delete page “${p.title}”? Links to /pages/${p.slug} will stop working.`)) return;
    await http.delete(`/admin/pages/${p.id}`);
    reload();
  }

  const updateSection = (i: number, patch: Partial<Draft["sections"][number]>) =>
    draft && setDraft({ ...draft, sections: draft.sections.map((s, si) => (si === i ? { ...s, ...patch } : s)) });

  return (
    <>
      <PageMeta title="Pages | Inaya Collection Admin" description="About, policies and other content pages." />
      <PageHeader title="Pages" description="Content pages linked from the footer and menus." actions={<Button onClick={() => open()}>+ New page</Button>} />
      <Card bodyClassName="p-0">
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.length === 0} emptyTitle="No pages yet.">
          {data && (
            <DataTable
              caption="Pages"
              rows={data}
              rowKey={(p) => p.id}
              columns={[
                { key: "title", header: "Title", cell: (p) => <span className="font-medium text-gray-800 dark:text-white/90">{p.title}</span> },
                { key: "url", header: "URL", cell: (p) => <a href={`${STOREFRONT_URL}/pages/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-theme-xs text-gray-500 hover:text-brand-500">/pages/{p.slug} ↗</a> },
                { key: "updated", header: "Updated", cell: (p) => date(p.updated_at) },
                { key: "status", header: "Status", cell: (p) => <ActiveBadge active={p.is_published} on="Published" off="Draft" /> },
                {
                  key: "actions",
                  header: <span className="sr-only">Actions</span>,
                  align: "end",
                  cell: (p) => (
                    <div className="flex justify-end gap-3 text-sm font-medium">
                      <button type="button" className="text-brand-500 hover:underline" onClick={() => open(p)}>Edit</button>
                      <button type="button" className="text-gray-500 hover:text-error-600" onClick={() => void remove(p)}>Delete</button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </DataState>
      </Card>

      <Modal isOpen={draft !== null} onClose={() => setDraft(null)} className="m-4 max-w-3xl p-6 sm:p-8">
        {draft && (
          <form onSubmit={save} noValidate className="max-h-[80vh] space-y-5 overflow-y-auto pe-1">
            <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit page" : "New page"}</h2>
            <Notice tone="error">{formError && (Object.keys(formError.errors).length ? formError.firstMessage : formError.message)}</Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Title" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} error={formError?.field("title")} maxLength={255} />
              <TextInput label="Slug" required value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} error={formError?.field("slug")} hint={`/pages/${draft.slug || "…"}`} maxLength={120} />
            </div>
            <div className="space-y-4">
              {draft.sections.map((s, i) => (
                <fieldset key={i} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <legend className="px-1 text-theme-xs font-semibold text-gray-500 uppercase">Section {i + 1}</legend>
                  <TextInput label="Heading (optional)" value={s.heading} onChange={(e) => updateSection(i, { heading: e.target.value })} maxLength={255} />
                  <TextAreaInput label="Text" rows={4} required value={s.body} onChange={(e) => updateSection(i, { body: e.target.value })} maxLength={10000} hint="Plain text. Line breaks are kept." />
                  {draft.sections.length > 1 && (
                    <button type="button" className="text-theme-xs font-medium text-error-600" onClick={() => setDraft({ ...draft, sections: draft.sections.filter((_, si) => si !== i) })}>Remove section</button>
                  )}
                </fieldset>
              ))}
              <button type="button" className="text-sm font-medium text-brand-500" onClick={() => setDraft({ ...draft, sections: [...draft.sections, { heading: "", body: "" }] })}>+ Add section</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Meta title" value={draft.meta_title} onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })} maxLength={255} />
              <TextInput label="Meta description" value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} maxLength={500} />
            </div>
            <Toggle label="Published" checked={draft.is_published} onChange={(v) => setDraft({ ...draft, is_published: v })} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save page</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
