import { useEffect, useState } from "react";
import { Notice, SelectInput, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ApiError, http } from "@/lib/api";
import type { Paginated, Product, ProductReview, ReviewStatus } from "@/types/api";

interface Draft {
  id?: number;
  product: { id: number; name: string } | null;
  name: string;
  email: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  is_verified_buyer: boolean;
}

interface ReviewEditorModalProps {
  /** Review to edit, `"new"` to add one, null when closed. */
  review: ProductReview | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}

function toDraft(review: ProductReview | "new"): Draft {
  if (review === "new") {
    return { product: null, name: "", email: "", rating: 5, title: "", body: "", status: "approved", is_verified_buyer: false };
  }
  return {
    id: review.id,
    product: review.product,
    name: review.name,
    email: review.email ?? "",
    rating: review.rating,
    title: review.title ?? "",
    body: review.body,
    status: review.status,
    is_verified_buyer: review.is_verified_buyer,
  };
}

/** Product search used when adding a review on behalf of a customer. */
function ProductPicker({ value, onChange, error }: { value: Draft["product"]; onChange: (p: Draft["product"]) => void; error?: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      http
        .get<Paginated<Product>>("/admin/products", { q: term, per_page: 8 })
        .then((res) => !cancelled && setResults(res.data))
        .catch(() => !cancelled && setResults([]));
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Product</span>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700">
          <span className="font-medium text-gray-800 dark:text-white/90">{value.name}</span>
          <button type="button" className="text-theme-xs font-medium text-brand-500" onClick={() => onChange(null)}>Change</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <TextInput label="Product" required value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU" error={error} maxLength={100} />
      {q.trim().length >= 2 && results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800" aria-label="Matching products">
          {results.map((p) => (
            <li key={p.id}>
              <button type="button" className="block w-full px-4 py-2 text-start text-sm hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" onClick={() => onChange({ id: p.id, name: p.name })}>
                {p.name} <span className="text-theme-xs text-gray-500">· {p.sku}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Add or edit a review. Admin-added reviews default to approved. */
export default function ReviewEditorModal({ review, onClose, onSaved }: ReviewEditorModalProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Reset the form whenever a different review is opened.
  const [openedFor, setOpenedFor] = useState<ProductReview | "new" | null>(null);
  if (review !== openedFor) {
    setOpenedFor(review);
    setDraft(review ? toDraft(review) : null);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    const body = {
      name: draft.name,
      email: draft.email || null,
      rating: draft.rating,
      title: draft.title || null,
      body: draft.body,
      status: draft.status,
      is_verified_buyer: draft.is_verified_buyer,
    };
    try {
      if (draft.id) await http.put(`/admin/reviews/${draft.id}`, body);
      else await http.post("/admin/reviews", { ...body, product_id: draft.product?.id ?? null });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not save the review.", 0));
    } finally {
      setBusy(false);
    }
  }

  const fe = (k: string) => error?.field(k);

  return (
    <Modal isOpen={review !== null} onClose={onClose} className="m-4 max-w-2xl p-6 sm:p-8">
      {draft && (
        <form onSubmit={save} noValidate className="max-h-[80vh] space-y-5 overflow-y-auto pe-1">
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{draft.id ? "Edit review" : "Add review"}</h2>
          <Notice tone="error">{error && !Object.keys(error.errors).length ? error.message : null}</Notice>

          {draft.id ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Product: <span className="font-medium text-gray-800 dark:text-white/90">{draft.product?.name ?? "Deleted product"}</span>
            </p>
          ) : (
            <ProductPicker value={draft.product} onChange={(product) => setDraft({ ...draft, product })} error={fe("product_id")} />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Customer name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={fe("name")} maxLength={120} />
            <TextInput label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} error={fe("email")} maxLength={255} />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Rating <span className="text-error-500" aria-hidden="true">*</span></legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={draft.rating === n}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setDraft({ ...draft, rating: n })}
                  className={`text-2xl leading-none ${n <= draft.rating ? "text-warning-500" : "text-gray-300 dark:text-gray-600"}`}
                >
                  ★
                </button>
              ))}
            </div>
            {fe("rating") && <p className="mt-1 text-theme-xs font-medium text-error-600">{fe("rating")}</p>}
          </fieldset>

          <TextInput label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} error={fe("title")} maxLength={150} />
          <TextAreaInput label="Review" required rows={5} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} error={fe("body")} maxLength={3000} />

          <div className="grid gap-4 md:grid-cols-2 md:items-center">
            <SelectInput
              label="Status"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as ReviewStatus })}
              options={[
                { value: "approved", label: "Approved — visible on the store" },
                { value: "pending", label: "Pending — awaiting review" },
                { value: "rejected", label: "Rejected — hidden" },
              ]}
            />
            <Toggle label="Verified buyer" description="Shows a “Verified buyer” label" checked={draft.is_verified_buyer} onChange={(v) => setDraft({ ...draft, is_verified_buyer: v })} />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={busy}>Save review</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
