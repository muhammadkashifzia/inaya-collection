"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, FormAlert, PasswordField, TextField } from "@/components/atoms";
import { api, ApiError } from "@/lib/api";
import { AuthCard } from "../AuthCard";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setDone((await api.resetPassword({ token, email: email.trim(), password, passwordConfirmation: confirmation })).message);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Please try again.", 0));
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Reset password">
        <FormAlert tone="error">This reset link is invalid. Please request a new one.</FormAlert>
        <p className="mt-4 text-center text-sm"><Link href="/account/forgot-password" className="underline">Request a new link</Link></p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <div className="space-y-4">
          <FormAlert tone="success">{done}</FormAlert>
          <p className="text-center text-sm"><Link href="/account/login" className="font-semibold underline">Sign in</Link></p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <FormAlert tone="error">{error && !error.field("password") ? (error.field("email") ?? error.message) : null}</FormAlert>
          <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordField label="New password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={error?.field("password")} hint="At least 8 characters with letters and numbers." />
          <PasswordField label="Confirm new password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          <Button type="submit" fullWidth size="lg" disabled={busy} aria-busy={busy}>
            {busy ? "Saving…" : "Reset password"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
