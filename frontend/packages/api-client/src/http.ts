// VITE_DEV_TENANT_SUBDOMAIN stands in for a real subdomain when running the
// frontend dev server against a backend with no wildcard DNS — mirrors the
// X-Tenant-Subdomain dev override already built into the backend's tenant
// resolution (backend/modules/tenants/tenants.service.ts). Unset in
// production, where the browser's real Host header carries the subdomain.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEV_TENANT_SUBDOMAIN = import.meta.env.VITE_DEV_TENANT_SUBDOMAIN as string | undefined;

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (DEV_TENANT_SUBDOMAIN) headers.set("X-Tenant-Subdomain", DEV_TENANT_SUBDOMAIN);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // sends/receives the httpOnly session cookie
  });

  if (!res.ok) {
    let code = "unknown_error";
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch {
      // response wasn't JSON — keep the defaults above
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
}

export { API_BASE_URL, DEV_TENANT_SUBDOMAIN };
