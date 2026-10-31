"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/atoms";
import { useToast } from "@/context/ToastContext";

const STORAGE_KEY = "newsletter-popup-dismissed";
/** Show the popup 3 seconds after first paint. */
const DELAY_MS = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Welcome newsletter popup shown once per visitor.
 * Dismissed state is stored in localStorage so it doesn't reappear after
 * the user clicks "No, Thanks" or successfully subscribes.
 */
export function NewsletterPopup() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Email address is required.";
    if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
    return null;
  }

  function handleChange(value: string) {
    setEmail(value);
    // Clear error as soon as the user fixes it.
    if (touched) setError(validate(value));
  }

  function handleBlur() {
    setTouched(true);
    setError(validate(email));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(email);
    setTouched(true);
    setError(err);
    if (err) return;

    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Subscribed!", data.message ?? "You're on the list!");
        dismiss();
      } else {
        setError(data.message ?? "Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <button type="button" aria-label="Close" tabIndex={-1} onClick={dismiss} className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Newsletter signup"
        tabIndex={-1}
        className="relative grid max-h-[90vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:max-w-[720px] sm:rounded-xl md:grid-cols-2"
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/80 text-muted transition-colors hover:bg-gray-100 hover:text-ink sm:h-8 sm:w-8 sm:bg-transparent"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Left: Image */}
        <div className="relative hidden aspect-[3/4] bg-[#f0b4b4] md:block">
          {/* Replace /images/newsletter-popup.jpg with your promotional image */}
          <img
            src="/images/newsletter-popup.jpg"
            alt="Sign up for exclusive offers"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right: Content */}
        <div className="flex flex-col justify-center gap-4 px-5 py-7 sm:gap-5 sm:px-6 sm:py-10 md:px-8">
          <div>
            <h2 className="font-heading text-xl font-bold leading-tight text-ink sm:text-2xl md:text-[28px]">
              Sign Up—Big Save!
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted sm:mt-2 sm:text-sm">
              Sign up for 10% off your first purchase and free shipping. Updates information on Sales and Offers.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-1.5" noValidate>
            <div>
              <input
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="Enter your email address …"
                aria-invalid={!!error}
                aria-describedby={error ? "popup-email-error" : undefined}
                className={`h-11 w-full rounded-full border px-5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-ink sm:h-12 ${error ? "border-error" : "border-line"}`}
              />
              {error && (
                <p id="popup-email-error" role="alert" className="mt-1.5 px-2 text-xs font-medium text-error">
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="h-11 cursor-pointer rounded-full bg-ink text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ink/85 disabled:opacity-60 sm:h-12"
            >
              {busy ? "Subscribing…" : "Subscribe"}
            </button>
          </form>

          <p className="text-xs text-muted">We promise not to spam your inbox.</p>

          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer self-start text-[13px] font-semibold text-ink underline underline-offset-4 transition-colors hover:text-brand sm:text-sm"
          >
            No, Thanks! Don&apos;t Show Again
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
