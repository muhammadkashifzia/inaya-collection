"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/atoms";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";

const STORAGE_KEY = "newsletter-popup-dismissed";
/** Show the popup 3 seconds after first paint. */
const DELAY_MS = 3000;

/**
 * Welcome newsletter popup shown once per visitor.
 * Dismissed state is stored in localStorage so it doesn't reappear after
 * the user clicks "No, Thanks" or successfully subscribes.
 */
export function NewsletterPopup() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.subscribe(email.trim());
      toast.success("Subscribed!", res.message ?? "You're on the list!");
      dismiss();
    } catch (error) {
      const message = error instanceof ApiError ? (error.field("email") ?? error.message) : "Please try again.";
      toast.error("Subscription Failed", message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button type="button" aria-label="Close" tabIndex={-1} onClick={dismiss} className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Newsletter signup"
        tabIndex={-1}
        className="relative grid w-full max-w-[720px] overflow-hidden rounded-xl bg-white shadow-2xl outline-none md:grid-cols-2"
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-gray-100 hover:text-ink"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Left: Image */}
        <div className="relative hidden aspect-[3/4] md:block">
          <Image
            src="/images/newsletter-popup.jpg"
            alt="Sign up for exclusive offers"
            fill
            sizes="360px"
            className="object-cover"
          />
        </div>

        {/* Right: Content */}
        <div className="flex flex-col justify-center gap-5 px-6 py-10 md:px-8">
          <div>
            <h2 className="font-heading text-2xl font-bold leading-tight text-ink md:text-[28px]">
              Sign Up—Big Save!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Sign up for 10% off your first purchase and free shipping. Updates information on Sales and Offers.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address …"
              className="h-12 rounded-full border border-line px-5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-ink"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-12 cursor-pointer rounded-full bg-ink text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {busy ? "Subscribing…" : "Subscribe"}
            </button>
          </form>

          <p className="text-xs text-muted">We promise not to spam your inbox.</p>

          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer self-start text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-brand"
          >
            No, Thanks! Don&apos;t Show Again
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
