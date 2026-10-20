import { useState } from "react";
import { Notice } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ApiError, http } from "@/lib/api";

type Scope = "page" | "all" | "selected" | "filtered";

interface ProductExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ids of the products on the current page. */
  pageIds: number[];
  selectedIds: number[];
  /** Current list filters (search, status, category…). */
  filters: Record<string, string | boolean | undefined>;
  hasFilters: boolean;
}

/** Shopify-style export: pick which products, download a CSV (one row per variant). */
export default function ProductExportModal({ isOpen, onClose, pageIds, selectedIds, filters, hasFilters }: ProductExportModalProps) {
  const [scope, setScope] = useState<Scope>(selectedIds.length ? "selected" : "page");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: { value: Scope; label: string; disabled?: boolean }[] = [
    { value: "page", label: "Current page", disabled: pageIds.length === 0 },
    { value: "all", label: "All products" },
    { value: "selected", label: `Selected: ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"}`, disabled: selectedIds.length === 0 },
    { value: "filtered", label: "Products matching your search and filters", disabled: !hasFilters },
  ];

  async function exportCsv() {
    setBusy(true);
    setError(null);
    const ids = scope === "page" ? pageIds : scope === "selected" ? selectedIds : [];
    const query: Record<string, string | boolean | undefined> = scope === "filtered" ? { ...filters } : {};
    // `ids[]` is sent as repeated keys; toQuery only supports scalars, so build them here.
    const idQuery = ids.map((id) => `ids[]=${id}`).join("&");
    try {
      await http.download(`/admin/products/export${idQuery ? `?${idQuery}` : ""}`, idQuery ? undefined : query, `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Export products</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Downloads a CSV with one row per variant. Open it in Excel or Google Sheets, edit, then import it back.</p>
        </div>
        <Notice tone="error">{error}</Notice>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Export</legend>
          {options.map((o) => (
            <label key={o.value} className={`flex items-center gap-3 text-sm ${o.disabled ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-700 dark:text-gray-300"}`}>
              <input
                type="radio"
                name="export-scope"
                value={o.value}
                checked={scope === o.value}
                disabled={o.disabled}
                onChange={() => setScope(o.value)}
                className="size-4 accent-brand-500"
              />
              {o.label}
            </label>
          ))}
        </fieldset>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">Format: CSV for Excel, Numbers, or other spreadsheet programs (UTF-8).</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void exportCsv()} loading={busy} disabled={options.find((o) => o.value === scope)?.disabled}>
            Export products
          </Button>
        </div>
      </div>
    </Modal>
  );
}
