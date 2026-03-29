export type BackendErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface BackendError {
  code: BackendErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface BackendSuccess<T> {
  ok: true;
  data: T;
}

export interface BackendFailure {
  ok: false;
  error: BackendError;
}

export type BackendResponse<T> = BackendSuccess<T> | BackendFailure;

export interface AdminSessionData {
  token: string;
  expiresAt: number;
}

export interface SyncResponseData {
  cursor: number;
  hasMore: boolean;
  events: BackendEvent[];
  deletedIds: string[];
}

export interface BackendEvent {
  id: string;
  date: string;
  type?: string | null;
  color?: string | null;
  all_day?: boolean | null;
  recurrence_freq?: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_interval?: number | null;
  recurrence_until?: string | null;
  parentEventId?: string | null;
  isOccurrence?: boolean | null;
  title_en?: string | null;
  title_ko?: string | null;
  description_en?: string | null;
  description_ko?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export class BackendApiError extends Error {
  code: BackendErrorCode;
  status: number;
  details?: Record<string, unknown>;
  retryAfter?: number;

  constructor(
    message: string,
    code: BackendErrorCode,
    status: number,
    details?: Record<string, unknown>,
    retryAfter?: number,
  ) {
    super(message);
    this.name = 'BackendApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

const TOKEN_KEY = 'okc_admin_token';
const PRODUCTION_BACKEND_BASE_URL =
  'https://orthodox-korea-calendar-backend-production.leontg.workers.dev';
const STAGING_BACKEND_BASE_URL =
  'https://orthodox-korea-calendar-backend-staging.leontg.workers.dev';

let cachedToken: string | null = null;

function getBackendBaseUrl(): string {
  const explicit = (import.meta.env.VITE_BACKEND_BASE_URL || '').trim();
  if (explicit) return explicit;

  const target = (import.meta.env.VITE_BACKEND_ENV || '').trim().toLowerCase();
  if (target === 'staging') return STAGING_BACKEND_BASE_URL;

  return PRODUCTION_BACKEND_BASE_URL;
}

export function getAuthToken(): string {
  if (cachedToken) return cachedToken;
  if (typeof window === 'undefined') return '';
  cachedToken = sessionStorage.getItem(TOKEN_KEY);
  return cachedToken || '';
}

export function setAuthToken(token: string): void {
  cachedToken = token;
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  cachedToken = null;
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const secs = Number.parseInt(value, 10);
  if (Number.isFinite(secs) && secs >= 0) return secs;
  const when = Date.parse(value);
  if (Number.isNaN(when)) return undefined;
  const deltaMs = when - Date.now();
  if (deltaMs <= 0) return 0;
  return Math.ceil(deltaMs / 1000);
}

function toError(
  status: number,
  payload: unknown,
  retryAfter?: number,
  fallbackMessage = 'Request failed',
): BackendApiError {
  const envelope = payload as Partial<BackendFailure> | null;
  if (envelope?.ok === false && envelope.error?.code && envelope.error?.message) {
    const detailsRetryAfter =
      typeof envelope.error.details?.retryAfter === 'number'
        ? envelope.error.details.retryAfter
        : typeof envelope.error.details?.retry_after === 'number'
          ? envelope.error.details.retry_after
          : undefined;

    return new BackendApiError(
      envelope.error.message,
      envelope.error.code,
      status,
      envelope.error.details,
      retryAfter ?? detailsRetryAfter,
    );
  }

  return new BackendApiError(
    fallbackMessage,
    status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
    status,
    undefined,
    retryAfter,
  );
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth) {
    const token = getAuthToken();
    if (!token) {
      throw new BackendApiError('Authentication required', 'UNAUTHORIZED', 401);
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    payload = text ? { ok: false, error: { code: 'INTERNAL_ERROR', message: text } } : null;
  }

  if (!response.ok) {
    throw toError(response.status, payload, retryAfter, 'Request failed');
  }

  const envelope = payload as Partial<BackendResponse<T>> | null;
  if (envelope?.ok === false) {
    throw toError(response.status, envelope, retryAfter, envelope.error?.message || 'Request failed');
  }

  if (envelope?.ok === true) {
    return envelope.data as T;
  }

  return payload as T;
}
