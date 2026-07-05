// ============================================================================
// API Client — the ONE place the React frontend talks to the real Express/
// Postgres backend (server.ts). Everything else in this app (dokanStore.ts,
// notificationStore.ts) is a localStorage-only demo shell; this file is the
// bridge to the actual database-backed order/RBAC system in src/lib/server/.
//
// The Express server serves the Vite app itself (see the bottom of
// server.ts), so relative "/api/..." paths always hit the same origin —
// no base URL or CORS config needed in dev or prod.
// ============================================================================

const TOKEN_KEY = "olimart_auth_token";
const USER_KEY = "olimart_auth_user";

export interface AuthUser {
  id: string;
  name: string;
  role: "super_admin" | "ops_admin" | "finance_admin" | "catalog_admin" | "support_admin" | "vendor_owner" | "vendor_staff" | "rider" | "customer";
  vendorId?: string;
  riderId?: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Generic authenticated fetch wrapper — attaches the Bearer session token
 * issued at /api/auth/login (see registration.ts / server.ts) and always
 * throws a real Error with the server's actual message on failure, never a
 * silently-swallowed rejection. */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(path, { ...options, headers });
  let data: any = null;
  try {
    data = await resp.json();
  } catch {
    // some endpoints (e.g. 204) may not return a body
  }
  if (!resp.ok) {
    throw new ApiError(data?.error || `Request failed with status ${resp.status}`, resp.status);
  }
  return data as T;
}

/** Real login against /api/auth/login — persists the session token so every
 * subsequent apiFetch call is authenticated as this user/role. */
export async function login(emailOrPhone: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ success: boolean; token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ emailOrPhone, password }),
  });
  setAuth(data.token, data.user);
  return data.user;
}

export function logout(): void {
  clearAuth();
}
