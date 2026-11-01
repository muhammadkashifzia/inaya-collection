import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { http } from "@/lib/api";
import { requestNotificationPermission, setAppBadge, subscribeToPush } from "@/utils/pushNotifications";

/* ------------------------------------------------------------------ types */

export interface AdminNotification {
  id: number;
  type: "new_order" | "new_message";
  title: string;
  body: string;
  link: string;
  reference_id: number | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationCounts {
  total_unread: number;
  unread_orders: number;
  unread_messages: number;
}

interface NotificationContextValue {
  notifications: AdminNotification[];
  counts: NotificationCounts;
  loading: boolean;
  /** Reload the full notification list + counts. */
  reload: () => void;
  /** Mark a single notification as read. */
  markRead: (id: number) => Promise<void>;
  /** Mark all as read. */
  markAllRead: () => Promise<void>;
  /** Mark all of a type as read (e.g. when visiting /orders or /messages). */
  markTypeRead: (type: "new_order" | "new_message") => Promise<void>;
}

const EMPTY_COUNTS: NotificationCounts = { total_unread: 0, unread_orders: 0, unread_messages: 0 };

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  counts: EMPTY_COUNTS,
  loading: false,
  reload: () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  markTypeRead: async () => {},
});

/* ------------------------------------------------------------------ hook */

export function useNotifications() {
  return useContext(NotificationContext);
}

/* ------------------------------------------------------------------ provider */

const POLL_INTERVAL = 30_000; // 30 seconds

interface ApiResponse {
  data: AdminNotification[];
  counts: NotificationCounts;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await http.get<ApiResponse>("/admin/notifications");
      setNotifications(res.data);
      setCounts(res.counts);
    } catch {
      // Silently ignore — user might be logged out or API unreachable.
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await http.get<NotificationCounts>("/admin/notifications/counts");
      setCounts(res);
    } catch {
      // Silently ignore.
    }
  }, []);

  // Initial load when user is authenticated
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setCounts(EMPTY_COUNTS);
      return;
    }

    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    // Try to subscribe to push notifications (asks permission once)
    void (async () => {
      const granted = await requestNotificationPermission();
      if (granted) await subscribeToPush();
    })();
  }, [user, fetchNotifications]);

  // Polling: counts every 30s (lightweight), full list every 2 min
  useEffect(() => {
    if (!user) return;

    let tick = 0;
    intervalRef.current = setInterval(() => {
      tick++;
      if (tick % 4 === 0) {
        // Every 2 minutes: full reload
        void fetchNotifications();
      } else {
        // Every 30s: just counts
        void fetchCounts();
      }
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchNotifications, fetchCounts]);

  const reload = useCallback(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(
    async (id: number) => {
      try {
        await http.patch(`/admin/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
        setCounts((prev) => ({
          ...prev,
          total_unread: Math.max(0, prev.total_unread - 1),
          unread_orders: Math.max(0, notifications.find((n) => n.id === id)?.type === "new_order" ? prev.unread_orders - 1 : prev.unread_orders),
          unread_messages: Math.max(0, notifications.find((n) => n.id === id)?.type === "new_message" ? prev.unread_messages - 1 : prev.unread_messages),
        }));
      } catch {
        // Silently ignore.
      }
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    try {
      await http.patch("/admin/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setCounts(EMPTY_COUNTS);
    } catch {
      // Silently ignore.
    }
  }, []);

  const markTypeRead = useCallback(async (type: "new_order" | "new_message") => {
    try {
      await http.patch("/admin/notifications/read-type", { type });
      setNotifications((prev) => prev.map((n) => (n.type === type ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)));
      setCounts((prev) => ({
        ...prev,
        total_unread: Math.max(0, type === "new_order" ? prev.total_unread - prev.unread_orders : prev.total_unread - prev.unread_messages),
        unread_orders: type === "new_order" ? 0 : prev.unread_orders,
        unread_messages: type === "new_message" ? 0 : prev.unread_messages,
      }));
    } catch {
      // Silently ignore.
    }
  }, []);

  // Update PWA app badge when unread count changes
  useEffect(() => {
    setAppBadge(counts.total_unread);
  }, [counts.total_unread]);

  const value: NotificationContextValue = {
    notifications,
    counts,
    loading,
    reload,
    markRead,
    markAllRead,
    markTypeRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
