import { lazy, Suspense, useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill-new"));

const MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const FORMATS = ["header", "bold", "italic", "underline", "strike", "list", "link", "image"];

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ label, value, onChange, error, placeholder, className }: RichTextEditorProps) {
  const modules = useMemo(() => MODULES, []);

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className={`quill-wrapper rounded-xl border ${error ? "border-error-400" : "border-gray-300 dark:border-gray-700"}`}>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-gray-50 dark:bg-white/3" />}>
          <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={FORMATS}
            placeholder={placeholder}
          />
        </Suspense>
      </div>
      {error && <p className="text-theme-xs font-medium text-error-600">{error}</p>}
    </div>
  );
}
