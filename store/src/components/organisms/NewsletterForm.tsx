"use client";

import { useState } from "react";
import { Button, StatusMessage } from "@/components/atoms";
import { api, ApiError } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      await api.subscribe(email.trim());
      setStatus("success");
      setMessage("Thank you for subscribing!");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof ApiError
          ? err.field("email") ?? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address for newsletter"
          className="h-11 flex-1 border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 outline-none transition-colors focus:border-white"
        />
        <Button
          type="submit"
          variant="light"
          size="md"
          disabled={status === "loading"}
        >
          {status === "loading" ? "…" : "Subscribe"}
        </Button>
      </div>

      {status === "success" && (
        <StatusMessage tone="success">{message}</StatusMessage>
      )}
      {status === "error" && (
        <StatusMessage tone="error">{message}</StatusMessage>
      )}
    </form>
  );
}
