import { useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DataState from "@/components/admin/DataState";
import { Notice } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import { date } from "@/lib/format";
import type { ContactMessage } from "@/types/api";

interface MessageDetailModalProps {
  /** Message to show; null keeps the modal closed. */
  id: number | null;
  onClose: () => void;
  /** Called after the message changed on the server (read state, deletion). */
  onChanged: () => void;
}

/** Full message view. Opening it marks the message as read on the server. */
export default function MessageDetailModal({ id, onClose, onChanged }: MessageDetailModalProps) {
  const { data, error, loading, reload, setData } = useApi(
    () => (id === null ? Promise.resolve(null) : http.get<ContactMessage>(`/admin/messages/${id}`)),
    [id],
  );
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const message = data && data.id === id ? data : null;

  const close = () => {
    setActionError(null);
    onClose();
    onChanged();
  };

  async function markUnread() {
    if (!message) return;
    setBusy(true);
    setActionError(null);
    try {
      setData(await http.patch<ContactMessage>(`/admin/messages/${message.id}/status`, { is_read: false }));
      close();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update the message.");
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (!message) return;
    setConfirmDelete(true);
  }

  async function onConfirmRemove() {
    if (!message) return;
    setBusy(true);
    setActionError(null);
    try {
      await http.delete(`/admin/messages/${message.id}`);
      toast.success("Message deleted.");
      close();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not delete the message.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  const replySubject = message ? `Re: ${message.subject ?? "Your message to Anaya Collection"}` : "";
  const phoneDigits = message?.phone?.replace(/\D/g, "") ?? "";
  // Local Pakistani numbers (03XX…) need the country code for wa.me links.
  const whatsappNumber = phoneDigits.startsWith("0") ? `92${phoneDigits.slice(1)}` : phoneDigits;

  return (
    <>
      <Modal isOpen={id !== null} onClose={close} className="m-4 max-w-2xl p-6 sm:p-8">
        <DataState loading={loading && !message} error={error} onRetry={reload} hasData={Boolean(message)}>
          {message && (
            <div className="max-h-[80vh] space-y-5 overflow-y-auto pe-1">
              <div>
                <p className="text-theme-xs font-semibold text-gray-500 uppercase dark:text-gray-400">{date(message.created_at, true)}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">{message.subject ?? `Message from ${message.name}`}</h2>
              </div>

              <dl className="grid gap-3 rounded-xl border border-gray-200 p-4 text-sm sm:grid-cols-2 dark:border-gray-800">
                <div>
                  <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="font-medium text-gray-800 dark:text-white/90">{message.name}</dd>
                </div>
                <div>
                  <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="break-all">
                    <a href={`mailto:${message.email}`} className="font-medium text-brand-500 hover:underline">{message.email}</a>
                  </dd>
                </div>
                <div>
                  <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd className="font-medium text-gray-800 dark:text-white/90">
                    {message.phone ? <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className="hover:text-brand-500">{message.phone}</a> : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Account</dt>
                  <dd className="font-medium text-gray-800 dark:text-white/90">{message.user_id ? "Registered customer" : "Guest"}</dd>
                </div>
              </dl>

              <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed whitespace-pre-line text-gray-800 dark:bg-white/3 dark:text-gray-200">{message.message}</div>

              <Notice tone="error">{actionError}</Notice>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(replySubject)}`}
                    className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                  >
                    Reply by email
                  </a>
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => void markUnread()} disabled={busy}>Mark as unread</Button>
                  <Button variant="danger" onClick={() => void remove()} disabled={busy}>Delete</Button>
                </div>
              </div>
            </div>
          )}
        </DataState>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete message?"
        message={message ? `Delete the message from ${message.name}? This cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
