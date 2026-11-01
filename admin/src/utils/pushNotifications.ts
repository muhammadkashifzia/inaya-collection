import { http } from "@/lib/api";

/**
 * Subscribes the admin browser to Web Push notifications.
 * Call this after the user logs in. Silently fails in environments
 * that don't support push or when VAPID is not configured.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Not supported in this browser.");
      return false;
    }

    console.log("[Push] Waiting for SW ready…");
    const registration = await navigator.serviceWorker.ready;
    console.log("[Push] SW ready. Checking existing subscription…");

    // Check if already subscribed
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log("[Push] Already subscribed, syncing with backend…");
      await sendSubscription(existing);
      return true;
    }

    // Get VAPID key from backend
    console.log("[Push] No subscription. Fetching VAPID key…");
    const { public_key } = await http.get<{ public_key: string }>("/admin/push/vapid-key");
    if (!public_key) {
      console.warn("[Push] VAPID key not configured on backend.");
      return false;
    }

    console.log("[Push] Subscribing to push…");
    const applicationServerKey = urlBase64ToUint8Array(public_key);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log("[Push] Subscribed! Sending to backend…");
    await sendSubscription(subscription);
    console.log("[Push] ✅ Subscription saved on backend.");
    return true;
  } catch (err) {
    console.error("[Push] Subscription failed:", err);
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
      console.log("[Push] Unsubscribed.");
    }
  } catch (err) {
    console.error("[Push] Unsubscribe failed:", err);
  }
}

/**
 * Requests notification permission from the user.
 * Returns true if permission is granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("[Push] Notification API not available.");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") {
    console.warn("[Push] Notification permission was denied by user.");
    return false;
  }

  console.log("[Push] Requesting notification permission…");
  const result = await Notification.requestPermission();
  console.log("[Push] Permission result:", result);
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

  if (!key || !auth) {
    console.error("[Push] Subscription missing p256dh or auth keys.");
    return;
  }

  await http.post("/admin/push/subscribe", {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
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
