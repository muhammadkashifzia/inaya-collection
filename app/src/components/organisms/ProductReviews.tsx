"use client";

import { useEffect, useState } from "react";
import { Button, FormAlert, Stars, TextAreaField, TextField } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import { useStore } from "@/context/StoreProvider";
import { api, ApiError } from "@/lib/api";
import type { ProductReview, ReviewInput, ReviewPage } from "@/types";

type Values = Required<Omit<ReviewInput, "rating">> & { rating: number };

const EMPTY: Values = { name: "", email: "", rating: 0, title: "", body: "", website: "" };

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

function RatingInput({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-ink">
        Your rating <span aria-hidden="true" className="text-brand">*</span>
      </legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
            <span
              aria-hidden="true"
              className={`block text-3xl leading-none transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-brand ${n <= value ? "text-amber-500" : "text-gray-300 hover:text-amber-300"}`}
            >
              ★
            </span>
            <span className="sr-only">{`${n} star${n === 1 ? "" : "s"}`}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-brand">{error}</p>}
    </fieldset>
  );
}

function ReviewForm({ slug, onDone }: { slug: string; onDone: (message: string) => void }) {
  const { user } = useStore();
  const [edits, setEdits] = useState<Partial<Values>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const values: Values = { ...EMPTY, name: user?.name ?? "", email: user?.email ?? "", ...edits };
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setEdits((v) => ({ ...v, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.submitReview(slug, {
        name: values.name.trim(),
        email: values.email.trim(),
        rating: values.rating,
        title: values.title.trim(),
        body: values.body.trim(),
        website: values.website,
      });
      setEdits({});
      onDone(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not submit your review. Please try again.", 0));
    } finally {
      setBusy(false);
    }
  }

  const fieldErrors = error ? ["name", "email", "rating", "title", "body"].some((f) => error.field(f)) : false;

  return (
    <form onSubmit={onSubmit} className="space-y-5 border border-line p-6" aria-label="Write a review">
      <h3 className="font-heading text-lg font-semibold">Write a review</h3>
      <FormAlert tone="error">{error ? (fieldErrors ? "Please fix the highlighted fields." : error.message) : null}</FormAlert>
      <RatingInput value={values.rating} onChange={(v) => set("rating", v)} error={error?.field("rating")} />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Name" required autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} error={error?.field("name")} maxLength={120} />
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          error={error?.field("email")}
          maxLength={255}
          hint="Not shown publicly."
        />
      </div>
      <TextField label="Title" value={values.title} onChange={(e) => set("title", e.target.value)} error={error?.field("title")} maxLength={150} />
      <TextAreaField label="Review" required rows={5} value={values.body} onChange={(e) => set("body", e.target.value)} error={error?.field("body")} minLength={10} maxLength={3000} />
      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="review-website">Website</label>
        <input id="review-website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} aria-busy={busy}>
        {busy ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}

function ReviewItem({ review }: { review: ProductReview }) {
  return (
    <li className="py-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars rating={review.rating} className="text-sm" />
        {review.title && <p className="font-semibold">{review.title}</p>}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">{review.body}</p>
      <p className="mt-3 text-xs text-muted">
        <span className="font-semibold text-ink">{review.name}</span>
        {review.isVerifiedBuyer && <span className="ms-2 text-emerald-700">✓ Verified buyer</span>}
        {review.createdAt && <span className="ms-2">· {formatDate(review.createdAt)}</span>}
      </p>
    </li>
  );
}

/** Approved customer reviews with a rating summary and a review form. */
export function ProductReviews({ slug }: { slug: string }) {
  const [data, setData] = useState<ReviewPage | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .productReviews(slug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setReviews(res.reviews);
        setLoadError(false);
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function loadMore() {
    if (!data) return;
    setLoadingMore(true);
    try {
      const next = await api.productReviews(slug, data.page + 1);
      setData(next);
      setReviews((r) => [...r, ...next.reviews]);
    } finally {
      setLoadingMore(false);
    }
  }

  const summary = data?.summary;

  return (
    <section className="mt-20" aria-label="Customer reviews" id="reviews">
      <SectionHeader title="Customer reviews" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-5">
          {summary && summary.count > 0 ? (
            <div>
              <p className="flex items-baseline gap-3">
                <span className="font-heading text-4xl font-semibold">{summary.average?.toFixed(1)}</span>
                <Stars rating={summary.average ?? 0} />
              </p>
              <p className="mt-1 text-sm text-muted">Based on {summary.count} review{summary.count === 1 ? "" : "s"}</p>
              <ul className="mt-4 space-y-1.5" aria-label="Rating breakdown">
                {summary.distribution.map((d) => (
                  <li key={d.stars} className="flex items-center gap-3 text-xs">
                    <span className="w-10 shrink-0">{d.stars} star</span>
                    <span className="h-2 flex-1 bg-cream" aria-hidden="true">
                      <span className="block h-full bg-amber-500" style={{ width: `${summary.count ? (d.count / summary.count) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 shrink-0 text-end text-muted">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            !loadError && data && <p className="text-sm text-muted">No reviews yet. Be the first to share your thoughts.</p>
          )}
          <FormAlert tone="success">{success}</FormAlert>
          {!showForm && (
            <Button variant="outline" onClick={() => { setShowForm(true); setSuccess(null); }}>
              Write a review
            </Button>
          )}
        </div>

        <div>
          {showForm && (
            <div className="mb-8">
              <ReviewForm
                slug={slug}
                onDone={(message) => {
                  setShowForm(false);
                  setSuccess(message);
                }}
              />
            </div>
          )}
          {loadError && <p className="text-sm text-muted">Reviews could not be loaded right now.</p>}
          {!data && !loadError && <div className="h-24 animate-pulse bg-cream" aria-hidden="true" />}
          {reviews.length > 0 && (
            <ul className="divide-y divide-line border-y border-line">
              {reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </ul>
          )}
          {data && data.page < data.lastPage && (
            <div className="mt-6">
              <Button variant="ghost" onClick={() => void loadMore()} disabled={loadingMore} aria-busy={loadingMore}>
                {loadingMore ? "Loading…" : "Show more reviews"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
