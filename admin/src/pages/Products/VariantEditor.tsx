import Card from "@/components/admin/Card";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon } from "@/icons";
import type { ApiError } from "@/lib/api";

export interface VariantDraft {
  id?: number;
  sku: string;
  name: string;
  options: { key: string; value: string }[];
  price: string;
  sale_price: string;
  stock: string;
  is_active: boolean;
}

const input =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

/**
 * Variants (size / colour). Stock is only editable for new variants;
 * existing stock is changed from Inventory so every change is logged.
 */
export default function VariantEditor({ variants, onChange, error }: { variants: VariantDraft[]; onChange: (v: VariantDraft[]) => void; error: ApiError | null }) {
  const update = (index: number, patch: Partial<VariantDraft>) => onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const err = (index: number, field: string) => error?.errors[`variants.${index}.${field}`]?.[0];

  return (
    <Card
      title="Variants"
      description="Add one row per size or colour. Simple products keep a single “Default” variant."
      actions={
        <Button size="sm" variant="outline" onClick={() => onChange([...variants, { sku: "", name: "", options: [{ key: "color", value: "" }], price: "", sale_price: "", stock: "0", is_active: true }])}>
          + Add variant
        </Button>
      }
    >
      {error?.field("variants") && !Object.keys(error.errors).some((k) => k.startsWith("variants.")) && (
        <p className="mb-3 text-theme-xs font-medium text-error-600">{error.field("variants")}</p>
      )}
      <div className="space-y-4">
        {variants.map((v, i) => (
          <fieldset key={v.id ?? `new-${i}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <legend className="px-1 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase">Variant {i + 1}</legend>
            <div className="grid gap-3 md:grid-cols-6">
              <label className="md:col-span-2">
                <span className="mb-1 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">Name *</span>
                <input className={input} value={v.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Red / M" maxLength={120} aria-invalid={Boolean(err(i, "name"))} />
                {err(i, "name") && <span className="text-theme-xs text-error-600">{err(i, "name")}</span>}
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">SKU *</span>
                <input className={input} value={v.sku} onChange={(e) => update(i, { sku: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} maxLength={64} aria-invalid={Boolean(err(i, "sku"))} />
                {err(i, "sku") && <span className="text-theme-xs text-error-600">{err(i, "sku")}</span>}
              </label>
              <label>
                <span className="mb-1 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">Price override</span>
                <input className={input} type="number" min={0} value={v.price} onChange={(e) => update(i, { price: e.target.value })} placeholder="Product price" />
              </label>
              <label>
                <span className="mb-1 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">Sale override</span>
                <input className={input} type="number" min={0} value={v.sale_price} onChange={(e) => update(i, { sale_price: e.target.value })} />
                {err(i, "sale_price") && <span className="text-theme-xs text-error-600">{err(i, "sale_price")}</span>}
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-3">
              {v.options.map((o, oi) => (
                <div key={oi} className="flex items-end gap-1">
                  <label>
                    <span className="mb-1 block text-theme-xs text-gray-500">Option</span>
                    <input className={`${input} w-28`} value={o.key} placeholder="color" onChange={(e) => update(i, { options: v.options.map((x, xi) => (xi === oi ? { ...x, key: e.target.value.toLowerCase() } : x)) })} />
                  </label>
                  <label>
                    <span className="mb-1 block text-theme-xs text-gray-500">Value</span>
                    <input className={`${input} w-32`} value={o.value} placeholder="Maroon" onChange={(e) => update(i, { options: v.options.map((x, xi) => (xi === oi ? { ...x, value: e.target.value } : x)) })} />
                  </label>
                  <button type="button" aria-label="Remove option" className="mb-2 px-1 text-gray-400 hover:text-error-500" onClick={() => update(i, { options: v.options.filter((_, xi) => xi !== oi) })}>
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="mb-2 text-theme-xs font-medium text-brand-500" onClick={() => update(i, { options: [...v.options, { key: "", value: "" }] })}>
                + Option
              </button>

              <div className="ms-auto flex items-end gap-4">
                <label>
                  <span className="mb-1 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{v.id ? "Stock" : "Initial stock"}</span>
                  <input className={`${input} w-24`} type="number" min={0} value={v.stock} disabled={Boolean(v.id)} onChange={(e) => update(i, { stock: e.target.value })} title={v.id ? "Change stock from Inventory" : undefined} />
                </label>
                <label className="mb-2.5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input type="checkbox" className="size-4 accent-brand-500" checked={v.is_active} onChange={(e) => update(i, { is_active: e.target.checked })} /> Active
                </label>
                {variants.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove variant ${i + 1}`}
                    className="mb-2 text-gray-400 hover:text-error-500"
                    onClick={() => (!v.id || window.confirm("Remove this variant? Past orders keep their details.")) && onChange(variants.filter((_, vi) => vi !== i))}
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                )}
              </div>
            </div>
          </fieldset>
        ))}
      </div>
    </Card>
  );
}
