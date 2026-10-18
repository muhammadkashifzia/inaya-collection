/**
 * Registers /sw.js in production builds so the admin portal is installable
 * as a PWA. Skipped in dev to avoid stale caches while working with Vite HMR.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error: unknown) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
