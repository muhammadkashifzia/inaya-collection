"use client";

import { useState } from "react";
import { Button, FormAlert, TextAreaField, TextField } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import type { ContactInput } from "@/types";

type Values = Required<ContactInput>;

const EMPTY: Values = { name: "", email: "", phone: "", subject: "", message: "", website: "" };
const VISIBLE_FIELDS = ["name", "email", "phone", "subject", "message"] as const;

/** Storefront contact form. Submissions land in the admin "Messages" inbox. */
export function ContactForm() {
  const { user } = useStore();
  const toast = useToast();
  // Only what the visitor typed; untouched name/email/phone fall back to the signed-in account.
  const [edits, setEdits] = useState<Partial<Values>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const defaults: Values = { ...EMPTY, name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" };
  const values: Values = { ...defaults, ...edits };

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEdits((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.submitContact({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
        website: values.website,
      });
      setSuccess(res.message);
      toast.success("Message Sent", res.message ?? "We'll get back to you soon.");
      setEdits({});
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not send your message. Please try again.", 0));
    } finally {
      setBusy(false);
    }
  }

  const hasFieldErrors = error ? VISIBLE_FIELDS.some((f) => error.field(f)) : false;

  return (
    <form onSubmit={onSubmit} className="space-y-5 border border-line p-6 md:p-8" aria-label="Contact us">
      <div>
        <h2 className="font-heading text-xl font-semibold">Send us a message</h2>
        <p className="mt-1 text-sm text-muted">We usually reply within one working day.</p>
      </div>

      <FormAlert tone="success">{success}</FormAlert>
      <FormAlert tone="error">{error && !hasFieldErrors ? error.message : hasFieldErrors ? "Please fix the highlighted fields." : null}</FormAlert>

      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Your name" name="name" required autoComplete="name" value={values.name} onChange={set("name")} error={error?.field("name")} minLength={2} maxLength={120} />
        <TextField label="Email" name="email" type="email" required autoComplete="email" value={values.email} onChange={set("email")} error={error?.field("email")} maxLength={255} />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={set("phone")} error={error?.field("phone")} maxLength={30} placeholder="03XX XXXXXXX" />
        <TextField label="Subject" name="subject" value={values.subject} onChange={set("subject")} error={error?.field("subject")} maxLength={200} />
      </div>

      <TextAreaField
        label="Message"
        name="message"
        required
        rows={6}
        value={values.message}
        onChange={set("message")}
        error={error?.field("message")}
        minLength={10}
        maxLength={5000}
        hint={`${values.message.length}/5000`}
      />

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>

      <Button type="submit" disabled={busy} aria-busy={busy} className="w-full md:w-auto">
        {busy ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
