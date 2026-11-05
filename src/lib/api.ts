import { auth } from './firebase';


/** Error thrown by apiFetch for non-2xx responses, carrying the server's error code. */
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * fetch() for our own /api routes: attaches the signed-in user's Firebase ID token.
 * Demo sessions have no Firebase user, so protected routes answer 401 auth_required.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch {
    // No token available (offline / demo); the server decides whether the route needs one.
  }
  return fetch(path, { ...init, headers });
}

/** POST JSON and return parsed JSON, throwing ApiError with a friendly message on failure. */
export async function apiPostJson<T = any>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `http_${res.status}`, friendlyApiMessage(res.status, data?.error, data?.message));
  }
  return data as T;
}

export function friendlyApiMessage(status: number, code?: string, serverMessage?: string): string {
  if (status === 401) return 'Sign in with Google to use AIRA and other AI features (they are not available in demo mode).';
  if (status === 429) return 'You are going a little fast. Please wait a minute and try again.';
  if (code === 'ai_not_configured') return 'AIRA is not available right now. Please try again later.';
  if (status === 503) return 'AIRA could not connect right now. Please try again in a moment.';
  return serverMessage || 'Something went wrong. Please try again.';
}
