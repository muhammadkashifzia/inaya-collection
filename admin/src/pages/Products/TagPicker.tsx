import { useState } from "react";
import { Link } from "react-router";
import Card from "@/components/admin/Card";
import { ApiError, http } from "@/lib/api";
import { cn } from "@/utils";
import type { Tag } from "@/types/api";

interface TagPickerProps {
  tags: Tag[] | null;
  loading: boolean;
  selected: number[];
  onChange: (ids: number[]) => void;
  /** Called after a tag was created inline so the list can reload. */
  onCreated: () => void;
  error?: string;
}

/** Toggle tags on a product, with a quick "add new tag" field. */
export default function TagPicker({ tags, loading, selected, onChange, onCreated, error }: TagPickerProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = tags?.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!selected.includes(existing.id)) onChange([...selected, existing.id]);
      setName("");
      return;
    }
    setBusy(true);
    setCreateError(null);
    try {
      const tag = await http.post<Tag>("/admin/tags", { name: trimmed });
      onChange([...selected, tag.id]);
      setName("");
      onCreated();
    } catch (err) {
      setCreateError(err instanceof ApiError ? (err.field("slug") ?? err.field("name") ?? err.message) : "Could not add the tag.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Tags" actions={<Link to="/products/tags" className="text-theme-xs font-medium text-brand-500 hover:underline">Manage</Link>}>
      <div className="space-y-4">
        {loading && !tags ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading tags…</p>
        ) : tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Product tags">
            {tags.map((t) => {
              const active = selected.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-theme-xs font-medium transition-colors",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-400"
                      : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400",
                  )}
                >
                  {active && <span aria-hidden="true">✓ </span>}
                  {t.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tags yet. Add one below.</p>
        )}
        {error && <p className="text-theme-xs font-medium text-error-600 dark:text-error-400">{error}</p>}

        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">New tag name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void create();
                }
              }}
              placeholder="New tag"
              maxLength={80}
              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
            />
          </label>
          <button
            type="button"
            onClick={() => void create()}
            disabled={busy || !name.trim()}
            className="h-10 rounded-lg px-3 text-sm font-medium text-brand-500 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
        {createError && <p className="text-theme-xs font-medium text-error-600 dark:text-error-400">{createError}</p>}
      </div>
    </Card>
  );
}
