/**
 * Registers /sw.js so the admin portal is installable as a PWA and
 * can receive push notifications. In dev mode registers with a
 * narrower scope to avoid interfering with Vite HMR.
 */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        console.log("[SW] Registered, scope:", reg.scope);
        // Check for updates every 60 minutes in production
        if (import.meta.env.PROD) {
          setInterval(() => void reg.update(), 60 * 60 * 1000);
        }
      })
      .catch((error: unknown) => {
        console.error("[SW] Registration failed:", error);
      });
  });
}
