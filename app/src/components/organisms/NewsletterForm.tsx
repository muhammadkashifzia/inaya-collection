"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ tone: "idle" | "busy" | "ok" | "error"; message?: string }>({ tone: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ tone: "busy" });
    try {
      const res = await api.subscribe(email.trim());
      setState({ tone: "ok", message: res.message });
      setEmail("");
    } catch (error) {
      setState({ tone: "error", message: error instanceof ApiError ? (error.field("email") ?? error.message) : "Please try again." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-sm">
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
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="h-11 flex-1 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 outline-none focus:bg-white/15"
        />
        <button
          type="submit"
          disabled={state.tone === "busy"}
          className="h-11 bg-brand px-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {state.tone === "busy" ? "…" : "Subscribe"}
        </button>
      </div>
      {state.message && (
        <p role={state.tone === "error" ? "alert" : "status"} className={state.tone === "error" ? "mt-2 text-xs text-red-300" : "mt-2 text-xs text-emerald-300"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
