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
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads one image immediately and stores the returned storage path. */
export default function ImageUpload({ label, endpoint, value, onChange, error, hint, aspect = "aspect-video" }: ImageUploadProps) {
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
      <div className={cn("relative overflow-hidden rounded-xl border border-dashed bg-gray-50 dark:bg-white/3", aspect, message ? "border-error-400" : "border-gray-300 dark:border-gray-700")}>
        {value.url ? (
          <img src={value.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-theme-xs text-gray-400">No image</div>
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm dark:bg-gray-900/70">Uploading…</div>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5">
          {value.url ? "Replace" : "Upload"}
        </button>
        {value.url && (
          <button type="button" onClick={() => onChange({ path: null, url: null })} className="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10">
            Remove
          </button>
        )}
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
