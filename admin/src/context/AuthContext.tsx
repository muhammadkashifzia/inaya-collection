import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { http, setUnauthorizedHandler, ApiError } from "@/lib/api";
import type { AdminUser, PermissionKey } from "@/types/api";

/**
 * Admin session (Sanctum cookie). Only admin/staff accounts may use the
 * dashboard; customers are signed out immediately. The API enforces the
 * same rules on every endpoint.
 *
 * AWS-style 2FA: every staff login goes through MFA. If 2FA is not yet
 * configured the user is forced to set it up before gaining access.
 */

type TwoFactorState = "none" | "setup" | "challenge";

interface AuthValue {
  user: AdminUser | null;
  ready: boolean;
  /** Current 2FA state after password auth. */
  twoFactorState: TwoFactorState;
  can: (permission: PermissionKey) => boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  /** Fetch the TOTP secret + QR URI for first-time setup. */
  fetchTwoFactorSetup: () => Promise<{ secret: string; uri: string }>;
  /** Confirm setup code and complete login. */
  confirmTwoFactorSetup: (code: string) => Promise<void>;
  /** Verify a TOTP code (already enrolled). */
  verifyTwoFactor: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the signed-in user (e.g. after changing the email). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>("none");

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    http
      .get<AdminUser>("/me")
      .then((me) => setUser(me.role === "customer" ? null : me))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const res = await http.post<{ data?: AdminUser; two_factor?: boolean; two_factor_setup?: boolean }>("/auth/login", { email, password, remember });

    if (res.two_factor) {
      setTwoFactorState(res.two_factor_setup ? "setup" : "challenge");
      return;
    }

    if (res.data?.role === "customer") {
      await http.post("/auth/logout").catch(() => undefined);
      throw new ApiError("This account does not have admin access.", 403);
    }
    setUser(await http.get<AdminUser>("/me"));
  }, []);

  const fetchTwoFactorSetup = useCallback(async () => {
    return await http.post<{ secret: string; uri: string }>("/auth/two-factor-setup", {});
  }, []);

  const confirmTwoFactorSetup = useCallback(async (code: string) => {
    const res = await http.post<{ data: AdminUser }>("/auth/two-factor-setup/confirm", { code });
    if (res.data.role === "customer") {
      await http.post("/auth/logout").catch(() => undefined);
      throw new ApiError("This account does not have admin access.", 403);
    }
    setTwoFactorState("none");
    setUser(await http.get<AdminUser>("/me"));
  }, []);

  const verifyTwoFactor = useCallback(async (code: string) => {
    const res = await http.post<{ data: AdminUser }>("/auth/two-factor-challenge", { code });
    if (res.data.role === "customer") {
      await http.post("/auth/logout").catch(() => undefined);
      throw new ApiError("This account does not have admin access.", 403);
    }
    setTwoFactorState("none");
    setUser(await http.get<AdminUser>("/me"));
  }, []);

  const logout = useCallback(async () => {
    await http.post("/auth/logout").catch(() => undefined);
    setUser(null);
    setTwoFactorState("none");
  }, []);

  const refresh = useCallback(async () => {
    const me = await http.get<AdminUser>("/me");
    setUser(me.role === "customer" ? null : me);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      twoFactorState,
      can: (permission) => user?.role === "admin" || Boolean(user?.permissions?.includes(permission)),
      login,
      fetchTwoFactorSetup,
      confirmTwoFactorSetup,
      verifyTwoFactor,
      logout,
      refresh,
    }),
    [user, ready, twoFactorState, login, fetchTwoFactorSetup, confirmTwoFactorSetup, verifyTwoFactor, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
