import { useState, type FormEvent } from "react";
import Card from "@/components/admin/Card";
import { Notice, TextInput, Toggle } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { ApiError, http } from "@/lib/api";

const toError = (err: unknown, fallback: string) => (err instanceof ApiError ? err : new ApiError(fallback, 0));

/** Must match the API rule: Password::min(8)->letters()->numbers(). */
function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 8) problems.push("at least 8 characters");
  if (!/[a-z]/i.test(password)) problems.push("a letter");
  if (!/[0-9]/.test(password)) problems.push("a number");
  return problems;
}

/** Change the signed-in admin's email. The current password is required. */
function ChangeEmailCard() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const unchanged = email.trim().toLowerCase() === (user?.email ?? "").toLowerCase();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      await http.put("/me/email", { email: email.trim(), current_password: currentPassword });
      await refresh();
      setSaved(`Your sign-in email is now ${email.trim().toLowerCase()}. Use it the next time you sign in.`);
      setEmail("");
      setCurrentPassword("");
    } catch (err) {
      setError(toError(err, "Could not change the email."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change email" description="The email address you use to sign in to the admin panel.">
      <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
        <Notice tone="success">{saved}</Notice>
        <Notice tone="error">{error && !Object.keys(error.errors).length ? error.message : null}</Notice>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current email: <strong className="text-gray-800 dark:text-white/90">{user?.email}</strong>
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="New email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error?.field("email")}
            maxLength={255}
          />
          <TextInput
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={error?.field("current_password")}
            hint="Confirm it's you."
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={busy} disabled={!email.trim() || !currentPassword || unchanged}>
            Update email
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Change the signed-in admin's password. Other devices are signed out by the API. */
function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);

  const problems = password ? passwordProblems(password) : [];
  const mismatch = confirmation !== "" && confirmation !== password;
  const sameAsCurrent = password !== "" && password === currentPassword;
  const canSubmit = currentPassword !== "" && password !== "" && problems.length === 0 && confirmation === password && !sameAsCurrent;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await http.put("/me/password", { current_password: currentPassword, password, password_confirmation: confirmation });
      setSaved(true);
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
    } catch (err) {
      setError(toError(err, "Could not change the password."));
    } finally {
      setBusy(false);
    }
  }

  const inputType = showPasswords ? "text" : "password";

  return (
    <Card title="Change password" description="Use at least 8 characters with letters and numbers.">
      <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
        <Notice tone="success">{saved ? "Password updated. You've been signed out on all other devices." : null}</Notice>
        <Notice tone="error">{error && !Object.keys(error.errors).length ? error.message : null}</Notice>

        <TextInput
          label="Current password"
          type={inputType}
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={error?.field("current_password")}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="New password"
            type={inputType}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error?.field("password") ?? (sameAsCurrent ? "The new password must be different from the current one." : undefined)}
            hint={problems.length ? `Needs ${problems.join(", ")}.` : password ? "Looks good." : undefined}
          />
          <TextInput
            label="Confirm new password"
            type={inputType}
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            error={mismatch ? "Passwords don't match." : undefined}
          />
        </div>
        <Toggle label="Show passwords" checked={showPasswords} onChange={setShowPasswords} />

        <div className="flex justify-end">
          <Button type="submit" loading={busy} disabled={!canSubmit}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** "Account" tab of the settings page: credentials of the signed-in user. */
export default function AccountSettings() {
  return (
    <>
      <ChangeEmailCard />
      <ChangePasswordCard />
    </>
  );
}
