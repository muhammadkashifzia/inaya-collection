/**
 * Admin API client for the Laravel backend (/api/v1).
 *
 * Auth is Sanctum SPA (session cookie + XSRF-TOKEN); nothing is stored in
 * localStorage. Every request includes credentials; writes send X-XSRF-TOKEN.
 * Authorization is enforced by the API, the UI only hides what can't be used.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL ?? "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  /** First message for a field (also matches nested keys like "variants.0.sku"). */
  field(name: string): string | undefined {
    if (this.errors[name]) return this.errors[name][0];
    const key = Object.keys(this.errors).find((k) => k.startsWith(`${name}.`));
    return key ? this.errors[key][0] : undefined;
  }

  get firstMessage(): string {
    const first = Object.values(this.errors)[0]?.[0];
    return first ?? this.message;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

let csrfPromise: Promise<void> | null = null;
async function ensureCsrf(force = false): Promise<void> {
  if (!force && readCookie("XSRF-TOKEN")) return;
  csrfPromise ??= fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" }).then(() => {
    csrfPromise = null;
  });
  return csrfPromise;
}

/** Called when the session has expired so the app can redirect to sign-in. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function toQuery(query: Query = {}): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  const isWrite = method !== "GET";
  if (isWrite) await ensureCsrf();

  const isForm = body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the API. Check that the backend is running.", 0);
  }

  if (res.status === 419 && !retried) {
    await ensureCsrf(true);
    return request<T>(method, path, body, true);
  }
  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth/")) onUnauthorized?.();
    const message =
      res.status === 403
        ? "You don't have permission to do that."
        : res.status === 429
          ? "Too many attempts. Please wait a minute."
          : (json.message as string) || `Request failed (${res.status}).`;
    throw new ApiError(message, res.status, json.errors ?? {});
  }
  return json as T;
}

export const http = {
  get: <T>(path: string, query?: Query) => request<T>("GET", `${path}${toQuery(query)}`),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
  ensureCsrf,
  /** Download a file from the API and trigger a browser save dialog. */
  async download(path: string, query?: Query, filename?: string): Promise<void> {
    await ensureCsrf();
    const xsrf = readCookie("XSRF-TOKEN");
    const headers: Record<string, string> = { Accept: "application/octet-stream" };
    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

    const res = await fetch(`${API_URL}/api/v1${path}${toQuery(query)}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new ApiError((json.message as string) || `Download failed (${res.status}).`, res.status);
    }

    const blob = await res.blob();
    const name = filename ?? res.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/)?.[1] ?? "download";
    saveBlob(blob, name);
  },
};

/** Trigger a browser download for an in-memory Blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
