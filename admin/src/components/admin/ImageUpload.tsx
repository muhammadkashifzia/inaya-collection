import { useRef, useState } from "react";
import { http, ApiError } from "@/lib/api";
import { cn } from "@/utils";

interface ImageUploadProps {
  label: string;
  /** API endpoint that accepts multipart `image` and returns { path, url }. */
  endpoint: string;
  value: { path: string | null; url: string | null };
  onChange: (value: { path: string | null; url: string | null }) => void;
  error?: string;
  hint?: string;
  aspect?: string;
  /** "contain" keeps the whole image visible (logos); "cover" fills the frame (photos). */
  fit?: "cover" | "contain";
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads one image immediately and stores the returned storage path. */
export default function ImageUpload({ label, endpoint, value, onChange, error, hint, fit = "cover" }: ImageUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploadError(null);
    if (!ACCEPT.split(",").includes(file.type)) {
      setUploadError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("Images must be smaller than 8 MB.");
      return;
    }
    const form = new FormData();
    form.append("image", file);
    setBusy(true);
    try {
      const res = await http.post<{ path: string; url: string }>(endpoint, form);
      onChange({ path: res.path, url: res.url });
    } catch (e) {
      setUploadError(e instanceof ApiError ? (e.field("image") ?? e.message) : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const message = uploadError ?? error;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-4">
        {/* Thumbnail preview */}
        <div className={cn("relative size-16 shrink-0 overflow-hidden rounded-lg border bg-gray-50 dark:bg-white/3", message ? "border-error-400" : "border-gray-200 dark:border-gray-700")}>
          {value.url ? (
            <img src={value.url} alt="" className={cn("h-full w-full", fit === "contain" ? "object-contain p-1" : "object-cover")} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          )}
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-theme-xs dark:bg-gray-900/70">…</div>}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
            {value.url ? "Replace image" : "Upload/Add image"}
          </button>
          {value.url && (
            <button type="button" onClick={() => onChange({ path: null, url: null })} className="rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10">
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
      {message ? <p className="text-theme-xs font-medium text-error-600">{message}</p> : hint && <p className="text-theme-xs text-gray-500">{hint}</p>}
    </div>
  );
}
