import { useRef, useState } from "react";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { ApiError, http } from "@/lib/api";
import type { Product, ProductImage } from "@/types/api";

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Upload, reorder (first image = main) and delete product images. */
export default function ProductImages({ product, onChange }: { product: Product; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [images, setImages] = useState<ProductImage[]>(product.images ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmImage, setConfirmImage] = useState<ProductImage | null>(null);
  const [lastSynced, setLastSynced] = useState(product.images);
  if (product.images !== lastSynced) {
    setLastSynced(product.images);
    setImages(product.images ?? []);
  }

  async function upload(files: FileList) {
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!ACCEPT.split(",").includes(file.type)) throw new ApiError(`${file.name}: only JPG, PNG or WebP images are allowed.`, 422);
        if (file.size > 5 * 1024 * 1024) throw new ApiError(`${file.name}: images must be under 5 MB.`, 422);
        const form = new FormData();
        form.append("image", file);
        form.append("alt", product.name);
        const created = await http.post<ProductImage>(`/admin/products/${product.id}/images`, form);
        setImages((list) => [...list, created]);
      }
      onChange();
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("image") ?? e.message) : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    try {
      await http.put(`/admin/products/${product.id}/images/order`, { image_ids: next.map((i) => i.id) });
    } catch {
      setError("Could not save the new order.");
    }
  }

  async function remove(image: ProductImage) {
    setConfirmImage(image);
  }

  async function onConfirmRemove() {
    if (!confirmImage) return;
    try {
      await http.delete(`/admin/products/${product.id}/images/${confirmImage.id}`);
      setImages((list) => list.filter((i) => i.id !== confirmImage.id));
      toast.success("Image deleted.");
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.firstMessage : "Could not delete the image.");
    } finally {
      setConfirmImage(null);
    }
  }

  return (
    <Card
      title="Images"
      description="JPG, PNG or WebP, at least 300×300 px. The first image is the main one."
      actions={
        <Button size="sm" variant="outline" loading={busy} onClick={() => input.current?.click()}>
          Upload images
        </Button>
      }
    >
      <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" aria-label="Upload product images" onChange={(e) => e.target.files?.length && void upload(e.target.files).finally(() => (e.target.value = ""))} />
      {error && <p role="alert" className="mb-3 text-theme-xs font-medium text-error-600">{error}</p>}
      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500 dark:border-gray-700">No images yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <img src={img.url} alt={img.alt ?? ""} className="aspect-3/4 w-full object-cover" loading="lazy" />
              {i === 0 && <span className="absolute start-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Main</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink-900/80 p-1.5">
                <div className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => void move(i, -1)} className="rounded px-2 text-white disabled:opacity-30" aria-label="Move earlier">
                    <span className="rtl:rotate-180">←</span>
                  </button>
                  <button type="button" disabled={i === images.length - 1} onClick={() => void move(i, 1)} className="rounded px-2 text-white disabled:opacity-30" aria-label="Move later">
                    <span className="rtl:rotate-180">→</span>
                  </button>
                </div>
                <button type="button" onClick={() => void remove(img)} className="rounded px-2 text-theme-xs text-error-300 hover:text-white">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={confirmImage !== null}
        title="Delete image?"
        message="Are you sure you want to delete this image? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setConfirmImage(null)}
      />
    </Card>
  );
}
