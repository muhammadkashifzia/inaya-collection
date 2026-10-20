import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import Card from "@/components/admin/Card";
import { Notice, TextInput } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError, http } from "@/lib/api";

const toError = (err: unknown, fallback: string) => (err instanceof ApiError ? err : new ApiError(fallback, 0));

/** Step 1: enter password to generate a new TOTP secret. */
function EnableForm({ onGenerated }: { onGenerated: (secret: string, uri: string) => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await http.post<{ secret: string; uri: string }>("/admin/two-factor/enable", { current_password: currentPassword });
      onGenerated(res.secret, res.uri);
    } catch (err) {
      setError(toError(err, "Could not start 2FA setup."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
      <Notice tone="error">{error && !Object.keys(error.errors).length ? error.message : null}</Notice>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Protect your account with a time-based one-time password (TOTP). You'll need an authenticator app like Google Authenticator or Authy.
      </p>
      <div className="max-w-sm">
        <TextInput
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={error?.field("current_password")}
          hint="Confirm it's you before enabling 2FA."
        />
      </div>
      <Button type="submit" loading={busy} disabled={!currentPassword}>
        Set up 2FA
      </Button>
    </form>
  );
}

/** Step 2: show QR code + secret and confirm with a code. */
function ConfirmForm({ secret, uri, onConfirmed }: { secret: string; uri: string; onConfirmed: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await http.post("/admin/two-factor/confirm", { code: code.trim() });
      onConfirmed();
    } catch (err) {
      setError(toError(err, "Verification failed."));
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => undefined);
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5" noValidate>
      <Notice tone="error">{error ? (error.field("code") ?? error.message) : null}</Notice>

      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the 6-digit code to verify.
        </p>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700">
            <QRCodeSVG
              value={uri}
              size={192}
              level="M"
              marginSize={0}
            />
          </div>
        </div>

        {/* Manual key fallback */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showManual ? "Hide manual key" : "Can't scan? Enter key manually"}
          </button>
        </div>

        {showManual && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Secret key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm tracking-widest break-all select-all text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
                {secret}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copySecret}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-xs">
        <TextInput
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          error={error?.field("code")}
          maxLength={6}
          hint="Enter the 6-digit code from your app."
        />
      </div>

      <Button type="submit" loading={busy} disabled={code.length !== 6}>
        Confirm & activate
      </Button>
    </form>
  );
}

/** Disable 2FA. */
function DisableForm({ onDisabled }: { onDisabled: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await http.post("/admin/two-factor/disable", { current_password: currentPassword });
      onDisabled();
    } catch (err) {
      setError(toError(err, "Could not disable 2FA."));
    } finally {
      setBusy(false);
    }
  }

  if (!confirm) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-success-100 text-success-600 dark:bg-success-500/10 dark:text-success-400">✓</span>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Two-factor authentication is active.</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your account is secured with a TOTP authenticator app. You'll be asked for a code every time you sign in.
        </p>
        <Button variant="outline" onClick={() => setConfirm(true)}>
          Disable 2FA
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
      <Notice tone="error">{error && !Object.keys(error.errors).length ? error.message : null}</Notice>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Disabling two-factor authentication will make your account less secure. Enter your password to confirm.
      </p>
      <div className="max-w-sm">
        <TextInput
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={error?.field("current_password")}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={busy} disabled={!currentPassword}>
          Disable 2FA
        </Button>
        <Button type="button" variant="outline" onClick={() => setConfirm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Two-factor authentication card for the Account settings tab. */
export default function TwoFactorSettings() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const isEnabled = user?.two_factor_enabled ?? false;

  // Setup flow: null → secret generated → confirmed
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);

  if (isEnabled && !setup) {
    return (
      <Card title="Two-factor authentication">
        <DisableForm
          onDisabled={() => {
            toast.success("Two-factor authentication disabled.");
            void refresh();
          }}
        />
      </Card>
    );
  }

  if (setup) {
    return (
      <Card title="Two-factor authentication" description="Scan the QR code with your authenticator app, then enter the code.">
        <ConfirmForm
          secret={setup.secret}
          uri={setup.uri}
          onConfirmed={() => {
            setSetup(null);
            toast.success("Two-factor authentication is now active.", "You'll need a code from your app on every sign-in.");
            void refresh();
          }}
        />
      </Card>
    );
  }

  return (
    <Card title="Two-factor authentication" description="Add an extra layer of security to your admin account.">
      <EnableForm onGenerated={(secret, uri) => setSetup({ secret, uri })} />
    </Card>
  );
}
