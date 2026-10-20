import { useRef, useState } from "react";
import { Notice } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ApiError, http, saveBlob } from "@/lib/api";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; handle: string; message: string }[];
}

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after an import changed at least one product. */
  onImported: () => void;
}

const SAMPLE_CSV = [
  "Handle,Title,Product SKU,Category,Status,Brand,Fabric,Pieces,Price,Sale Price,Featured,Low Stock Threshold,Short Description,Description,Details,Tags,SEO Title,SEO Description,Published At,Variant SKU,Variant Name,Option1 Name,Option1 Value,Option2 Name,Option2 Value,Option3 Name,Option3 Value,Variant Price,Variant Sale Price,Variant Stock,Variant Active,Image URLs",
  'noor-khaddar-3-piece,Noor Khaddar 3 Piece,NOOR-01,winter,active,Anaya,Khaddar,3,3999,3299,FALSE,5,Warm printed khaddar suit,,Printed shirt | Dyed trouser,"New Arrival, Winter",,,,NOOR-01-S,,Size,S,,,,,,,10,TRUE,',
  "noor-khaddar-3-piece,,,,,,,,,,,,,,,,,,,NOOR-01-M,,Size,M,,,,,,,8,TRUE,",
  "noor-khaddar-3-piece,,,,,,,,,,,,,,,,,,,NOOR-01-L,,Size,L,,,,,4199,,5,TRUE,",
].join("\r\n");

const MAX_BYTES = 5 * 1024 * 1024;

/** Shopify-style CSV import with an overwrite option and a per-row error report. */
export default function ProductImportModal({ isOpen, onClose, onImported }: ProductImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setFile(null);
    setOverwrite(false);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  function pick(f: File | null) {
    setError(null);
    setResult(null);
    if (f && !/\.csv$/i.test(f.name)) {
      setError("Choose a .csv file.");
      setFile(null);
      return;
    }
    if (f && f.size > MAX_BYTES) {
      setError("The file must be 5 MB or smaller.");
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    body.append("overwrite", overwrite ? "1" : "0");
    try {
      const res = await http.post<ImportResult>("/admin/products/import", body);
      setResult(res);
      if (res.created + res.updated > 0) onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstMessage : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} className="m-4 max-w-xl p-6 sm:p-8">
      <div className="max-h-[80vh] space-y-5 overflow-y-auto pe-1">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Import products by CSV</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            One row per variant. Rows with the same Handle belong to one product.{" "}
            <button type="button" className="font-medium text-brand-500 hover:underline" onClick={() => saveBlob(new Blob(["\uFEFF" + SAMPLE_CSV], { type: "text/csv;charset=utf-8" }), "product_template.csv")}>
              Download sample CSV
            </button>
          </p>
        </div>

        <Notice tone="error">{error}</Notice>

        {result ? (
          <div className="space-y-4">
            <Notice tone="success">
              {result.created} created, {result.updated} updated, {result.skipped} skipped
              {result.errors.length > 0 && `, ${result.errors.length} error${result.errors.length === 1 ? "" : "s"}`}.
            </Notice>
            {result.skipped > 0 && !overwrite && (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">Skipped products already exist. Import again with "Overwrite" checked to update them.</p>
            )}
            {result.errors.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full text-start text-sm">
                  <caption className="sr-only">Import errors</caption>
                  <thead className="bg-gray-50 text-theme-xs text-gray-500 dark:bg-white/3 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-start font-medium">Row</th>
                      <th scope="col" className="px-3 py-2 text-start font-medium">Handle</th>
                      <th scope="col" className="px-3 py-2 text-start font-medium">Problem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{e.row}</td>
                        <td className="max-w-40 truncate px-3 py-2 text-gray-700 dark:text-gray-300">{e.handle}</td>
                        <td className="px-3 py-2 text-error-600 dark:text-error-400">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={reset}>
                Import another file
              </Button>
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <label
              htmlFor="product-import-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 px-6 py-8 text-center hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-800"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file ? file.name : "Choose a CSV file"}</span>
              <span className="text-theme-xs text-gray-500 dark:text-gray-400">{file ? `${(file.size / 1024).toFixed(1)} KB` : "Up to 5 MB, 5,000 rows"}</span>
              <input
                ref={inputRef}
                id="product-import-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
            </label>

            <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="mt-0.5 size-4 accent-brand-500" />
              <span>
                Overwrite products with matching Product SKU or Handle
                <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                  Blank or missing columns keep their current values. Variants not listed in the file are removed, and Variant Stock sets the stock level.
                </span>
              </span>
            </label>

            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Category accepts a category slug or name. Prices are in rupees. Images aren't imported; add them on the product page.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={() => void upload()} loading={busy} disabled={!file}>
                Import products
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
