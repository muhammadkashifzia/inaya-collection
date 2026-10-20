import { useRef, useState } from "react";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { ApiError, http } from "@/lib/api";
import type { Product, ProductImage } from "@/types/api";

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Upload, reorder (first image = main) and delete product images — split into Product image + Product gallery. */
export default function ProductImages({ product, onChange }: { product: Product; onChange: () => void }) {
  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
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

  const mainImage = images[0] ?? null;
  const galleryImages = images.slice(1);

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

  async function makeMain(image: ProductImage) {
    const next = [image, ...images.filter((i) => i.id !== image.id)];
    setImages(next);
    try {
      await http.put(`/admin/products/${product.id}/images/order`, { image_ids: next.map((i) => i.id) });
    } catch {
      setError("Could not save the new order.");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    // index is relative to galleryImages, so actual index is index + 1
    const actualIdx = index + 1;
    const target = actualIdx + dir;
    if (target < 1 || target >= images.length) return;
    const next = [...images];
    [next[actualIdx], next[target]] = [next[target], next[actualIdx]];
    setImages(next);
    try {
      await http.put(`/admin/products/${product.id}/images/order`, { image_ids: next.map((i) => i.id) });
    } catch {
      setError("Could not save the new order.");
    }
  }

  function confirmRemove(image: ProductImage) {
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
    <>
      {/* ── Product image (main) ── */}
      <Card title="Product image">
        <input ref={mainInput} type="file" accept={ACCEPT} className="sr-only" aria-label="Set product image" onChange={(e) => e.target.files?.length && void upload(e.target.files).finally(() => (e.target.value = ""))} />
        {error && <p role="alert" className="mb-3 text-theme-xs font-medium text-error-600">{error}</p>}
        {mainImage ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <img src={mainImage.url} alt={mainImage.alt ?? ""} className="aspect-3/4 w-full object-cover" loading="lazy" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => mainInput.current?.click()} disabled={busy} className="text-sm font-medium text-brand-500 hover:underline">
                Replace
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button type="button" onClick={() => confirmRemove(mainImage)} className="text-sm font-medium text-error-500 hover:underline">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => mainInput.current?.click()}
            disabled={busy}
            className="text-sm font-medium text-brand-500 underline hover:text-brand-600 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Set product image"}
          </button>
        )}
      </Card>

      {/* ── Product gallery ── */}
      <Card title="Product gallery">
        <input ref={galleryInput} type="file" accept={ACCEPT} multiple className="sr-only" aria-label="Add gallery images" onChange={(e) => e.target.files?.length && void upload(e.target.files).finally(() => (e.target.value = ""))} />
        {galleryImages.length > 0 ? (
          <div className="space-y-3">
            <ul className="grid grid-cols-3 gap-2">
              {galleryImages.map((img, i) => (
                <li key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                  <img src={img.url} alt={img.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                    <button type="button" onClick={() => void makeMain(img)} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-800 hover:bg-white" title="Set as main">
                      Main
                    </button>
                    <button type="button" disabled={i === 0} onClick={() => void move(i, -1)} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-gray-800 hover:bg-white disabled:opacity-30" title="Move left">
                      ←
                    </button>
                    <button type="button" disabled={i === galleryImages.length - 1} onClick={() => void move(i, 1)} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-gray-800 hover:bg-white disabled:opacity-30" title="Move right">
                      →
                    </button>
                    <button type="button" onClick={() => confirmRemove(img)} className="rounded bg-error-500/90 px-1.5 py-0.5 text-[10px] text-white hover:bg-error-600" title="Delete">
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => galleryInput.current?.click()}
              disabled={busy}
              className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-center text-sm text-brand-500 hover:border-brand-300 dark:border-gray-700"
            >
              {busy ? "Uploading…" : "+ Add more images"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => galleryInput.current?.click()}
            disabled={busy}
            className="text-sm font-medium text-brand-500 underline hover:text-brand-600 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Add product gallery images"}
          </button>
        )}
      </Card>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={confirmImage !== null}
        title="Delete image?"
        message="Are you sure you want to delete this image? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setConfirmImage(null)}
      />
    </>
  );
}
