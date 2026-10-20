import ImageUpload from "@/components/admin/ImageUpload";
import { SelectInput, TextInput } from "@/components/admin/Fields";
import type { ApiError } from "@/lib/api";

/** Editable card of an "image_banners" homepage section. */
export interface ImageBannerItemDraft {
  image: { path: string | null; url: string | null };
  title: string;
  subtitle: string;
  href: string;
  align: "left" | "center";
}

export const emptyImageBannerItem = (): ImageBannerItemDraft => ({ image: { path: null, url: null }, title: "", subtitle: "", href: "", align: "center" });

interface ImageBannerItemsEditorProps {
  items: ImageBannerItemDraft[];
  onChange: (items: ImageBannerItemDraft[]) => void;
  error: ApiError | null;
  max?: number;
}

/** Repeater for image cards: upload a background image and the text shown on top of it. */
export default function ImageBannerItemsEditor({ items, onChange, error, max = 12 }: ImageBannerItemsEditorProps) {
  const update = (index: number, patch: Partial<ImageBannerItemDraft>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index: number, dir: -1 | 1) => {
    const other = index + dir;
    if (other < 0 || other >= items.length) return;
    const next = [...items];
    [next[index], next[other]] = [next[other], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cards ({items.length})</span>
        {error?.field("items") && <span className="text-theme-xs font-medium text-error-600">{error.field("items")}</span>}
      </div>

      {items.map((item, i) => (
        <fieldset key={i} className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2 dark:border-gray-800">
          <legend className="px-1 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Card {i + 1}</legend>
          <ImageUpload
            label="Background image *"
            endpoint="/admin/banners/image"
            value={item.image}
            onChange={(image) => update(i, { image })}
            error={error?.field(`items.${i}.image`)}
            hint="Recommended 800×340 (wide)"
            aspect="aspect-[12/5]"
          />
          <div className="space-y-3">
            <TextInput label="Text on image" value={item.title} onChange={(e) => update(i, { title: e.target.value })} error={error?.field(`items.${i}.title`)} maxLength={60} placeholder="e.g. Velvet" />
            <TextInput label="Small text above (optional)" value={item.subtitle} onChange={(e) => update(i, { subtitle: e.target.value })} error={error?.field(`items.${i}.subtitle`)} maxLength={60} placeholder="e.g. Cambric" />
            <SelectInput
              label="Text position"
              value={item.align}
              onChange={(e) => update(i, { align: e.target.value as ImageBannerItemDraft["align"] })}
              options={[
                { value: "center", label: "Center" },
                { value: "left", label: "Left" },
              ]}
              error={error?.field(`items.${i}.align`)}
            />
            <TextInput label="Link (optional)" value={item.href} onChange={(e) => update(i, { href: e.target.value })} error={error?.field(`items.${i}.href`)} maxLength={255} placeholder="/collections/velvet" />
            <div className="flex gap-3 text-theme-xs font-medium">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:text-gray-400 dark:hover:text-white">Move up</button>
              <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:text-gray-400 dark:hover:text-white">Move down</button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="ms-auto text-error-600 hover:underline">Remove card</button>
            </div>
          </div>
        </fieldset>
      ))}

      {items.length < max && (
        <button
          type="button"
          onClick={() => onChange([...items, emptyImageBannerItem()])}
          className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-brand-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
        >
          + Add card
        </button>
      )}
    </div>
  );
}
