"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Email address is required.";
    if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
    return null;
  }

  function handleChange(value: string) {
    setEmail(value);
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

    setState("busy");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("ok");
        toast.success("Subscribed", data.message ?? "You're on the list!");
        setEmail("");
        setError(null);
        setTouched(false);
      } else {
        setState("idle");
        setError(data.message ?? "Please try again.");
      }
    } catch {
      setState("idle");
      setError("Could not reach the server. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-sm" noValidate>
      <label htmlFor="newsletter-email" className="mb-2 block text-sm font-semibold uppercase tracking-widest">
        Join our newsletter
      </label>
      <div className="flex">
        <input
          id="newsletter-email"
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Email address"
          aria-invalid={!!error}
          aria-describedby={error ? "footer-email-error" : undefined}
          className={`h-11 flex-1 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 outline-none focus:bg-white/15 ${error ? "ring-1 ring-error" : ""}`}
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="h-11 bg-[#9e0e26] px-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[#8a0c21] disabled:opacity-60"
        >
          {state === "busy" ? "…" : "Subscribe"}
        </button>
      </div>
      {error && (
        <p id="footer-email-error" role="alert" className="mt-2 text-xs font-medium text-red-400">
          {error}
        </p>
      )}
      {state === "ok" && !error && (
        <p role="status" className="mt-2 text-xs text-emerald-300">
          Subscribed successfully!
        </p>
      )}
    </form>
  );
}
