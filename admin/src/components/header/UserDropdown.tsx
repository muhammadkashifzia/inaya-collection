import { useAuth } from "@/context/AuthContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { LogoutIcon, SettingsAltIcon } from "@/icons";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

/** Signed-in admin menu: name, role, settings and sign out. */
export default function UserDropdown() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));

  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white dark:bg-white/10">{initials}</span>
        <span className="hidden text-start sm:block">
          <span className="block text-theme-sm font-medium">{user.name}</span>
          <span className="block text-theme-xs text-gray-500 capitalize">{user.role}</span>
        </span>
        <span aria-hidden="true" className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div role="menu" className="absolute inset-e-0 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-3 pb-3 dark:border-gray-800">
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{user.name}</p>
            <p className="truncate text-theme-xs text-gray-500">{user.email}</p>
          </div>
          <ul className="flex flex-col gap-1 pt-3">
            {can("manage-settings") && (
              <li>
                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <SettingsAltIcon className="size-5" /> Store settings
                </Link>
              </li>
            )}
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  await logout();
                  navigate("/signin", { replace: true });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <LogoutIcon className="size-5" /> Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
