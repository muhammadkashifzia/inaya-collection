import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";
import type { PermissionKey } from "@/types/api";
import Forbidden from "@/components/admin/Forbidden";

/** Redirects guests to /signin; renders child routes for staff. */
export function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 text-ink-100">
        <span className="animate-pulse text-sm tracking-widest uppercase">Loading…</span>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Hides a page the current role can't use (the API would reject it anyway). */
export function RequirePermission({ permission, children }: { permission: PermissionKey; children: React.ReactNode }) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <Forbidden />;
}
