import { http } from "@/lib/api";

/**
 * Subscribes the admin browser to Web Push notifications.
 * Call this after the user logs in. Silently fails in environments
 * that don't support push or when VAPID is not configured.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Send to backend in case it was lost
      await sendSubscription(existing);
      return true;
    }

    // Get VAPID key from backend
    const { public_key } = await http.get<{ public_key: string }>("/admin/push/vapid-key");
    if (!public_key) return false;

    const applicationServerKey = urlBase64ToUint8Array(public_key);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    await sendSubscription(subscription);
    return true;
  } catch {
    // Push not supported or permission denied — that's fine.
    return false;
  }
}

/**
 * Unsubscribes from push notifications.
 */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await http.post("/admin/push/unsubscribe", { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
  } catch {
    // Silently ignore.
  }
}

/**
 * Requests notification permission from the user.
 * Returns true if permission is granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Clears the app badge (call when user views notifications).
 */
export function clearAppBadge(): void {
  if ("clearAppBadge" in navigator) {
    (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {});
  }
}

/**
 * Sets the app badge count (for PWA icon).
 */
export function setAppBadge(count: number): void {
  if ("setAppBadge" in navigator) {
    if (count > 0) {
      (navigator as unknown as { setAppBadge: (n: number) => Promise<void> }).setAppBadge(count).catch(() => {});
    } else {
      clearAppBadge();
    }
  }
}

/* ── Helpers ── */

async function sendSubscription(subscription: PushSubscription): Promise<void> {
  const key = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  await http.post("/admin/push/subscribe", {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : "",
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : "",
    },
  });
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
