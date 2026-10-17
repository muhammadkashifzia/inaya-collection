"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, FormAlert, TextField } from "@/components/atoms";
import { api, ApiError } from "@/lib/api";
import { AuthCard } from "../AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setMessage((await api.forgotPassword(email.trim())).message);
    } catch (err) {
      setError(err instanceof ApiError ? (err.field("email") ?? err.message) : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Reset password" footer={<Link href="/account/login" className="underline">Back to sign in</Link>}>
      {message ? (
        <FormAlert tone="success">{message}</FormAlert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <p className="text-sm text-muted">Enter your email and we&apos;ll send you a link to reset your password.</p>
          <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} maxLength={255} />
          <Button type="submit" fullWidth size="lg" disabled={busy} aria-busy={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
