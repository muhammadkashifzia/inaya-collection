import { useEffect, useRef, useState } from "react";
import Card from "@/components/admin/Card";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SIZE = 5 * 1024 * 1024;

/** A local preview of a file not yet uploaded. */
interface StagedFile {
  file: File;
  preview: string;
}

export interface StagedImages {
  main: File | null;
  gallery: File[];
}

/**
 * Image picker for the **create product** page. Files are staged locally
 * (with blob-URL previews) and handed to the parent via `onChange` so they
 * can be uploaded once the product is saved.
 */
export default function StagedProductImages({ onChange }: { onChange: (staged: StagedImages) => void }) {
  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [main, setMain] = useState<StagedFile | null>(null);
  const [gallery, setGallery] = useState<StagedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Revoke blob URLs on unmount to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (main) URL.revokeObjectURL(main.preview);
      gallery.forEach((g) => URL.revokeObjectURL(g.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function notify(nextMain: StagedFile | null, nextGallery: StagedFile[]) {
    onChange({
      main: nextMain?.file ?? null,
      gallery: nextGallery.map((g) => g.file),
    });
  }

  function validate(file: File): string | null {
    if (!ACCEPT.split(",").includes(file.type)) return `${file.name}: only JPG, PNG or WebP allowed.`;
    if (file.size > MAX_SIZE) return `${file.name}: must be under 5 MB.`;
    return null;
  }

  function handleMain(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    // Revoke old preview
    if (main) URL.revokeObjectURL(main.preview);
    const next: StagedFile = { file, preview: URL.createObjectURL(file) };
    setMain(next);
    notify(next, gallery);
  }

  function removeMain() {
    if (main) URL.revokeObjectURL(main.preview);
    setMain(null);
    notify(null, gallery);
  }

  function handleGallery(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const added: StagedFile[] = [];
    for (const file of Array.from(files)) {
      const err = validate(file);
      if (err) { setError(err); return; }
      added.push({ file, preview: URL.createObjectURL(file) });
    }
    const next = [...gallery, ...added];
    setGallery(next);
    notify(main, next);
  }

  function removeGallery(index: number) {
    URL.revokeObjectURL(gallery[index].preview);
    const next = gallery.filter((_, i) => i !== index);
    setGallery(next);
    notify(main, next);
  }

  return (
    <>
      {/* ── Product image (main) ── */}
      <Card title="Product image">
        <input
          ref={mainInput}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label="Set product image"
          onChange={(e) => { handleMain(e.target.files); e.target.value = ""; }}
        />
        {error && <p role="alert" className="mb-3 text-theme-xs font-medium text-error-600">{error}</p>}
        {main ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <img src={main.preview} alt="" className="aspect-3/4 w-full object-cover" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => mainInput.current?.click()} className="text-sm font-medium text-brand-500 hover:underline">
                Replace
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button type="button" onClick={removeMain} className="text-sm font-medium text-error-500 hover:underline">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => mainInput.current?.click()}
            className="text-sm font-medium text-brand-500 underline hover:text-brand-600"
          >
            Set product image
          </button>
        )}
      </Card>

      {/* ── Product gallery ── */}
      <Card title="Product gallery">
        <input
          ref={galleryInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-label="Add gallery images"
          onChange={(e) => { handleGallery(e.target.files); e.target.value = ""; }}
        />
        {gallery.length > 0 ? (
          <div className="space-y-3">
            <ul className="grid grid-cols-3 gap-2">
              {gallery.map((img, i) => (
                <li key={i} className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                  <img src={img.preview} alt="" className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => removeGallery(i)}
                      className="rounded bg-error-500/90 px-1.5 py-0.5 text-[10px] text-white hover:bg-error-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => galleryInput.current?.click()}
              className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-center text-sm text-brand-500 hover:border-brand-300 dark:border-gray-700"
            >
              + Add more images
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => galleryInput.current?.click()}
            className="text-sm font-medium text-brand-500 underline hover:text-brand-600"
          >
            Add product gallery images
          </button>
        )}
      </Card>
    </>
  );
}
