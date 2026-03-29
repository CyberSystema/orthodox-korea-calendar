import type {
  AdminMeResponse,
  ApiResponse,
  ClientConfigResponse,
  CreateEventInput,
  ListEventsParams,
  ListEventsResponse,
  LoginRequest,
  LoginResponse,
  NotifyInput,
  NotifyResponse,
  RegisterSubscriptionInput,
  SyncParams,
  SyncResponse,
  ApiEvent,
  UpdateEventInput,
} from './contracts';
import type { AdminTokenStore, SyncCursorStore } from './stores';

export class BackendApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'BackendApiError';
  }
}

export interface OrthodoxCalendarApiClientOptions {
  fetchImpl?: typeof fetch;
  tokenStore?: AdminTokenStore;
  defaultHeaders?: Record<string, string>;
}

type SyncWindowOptions = { from: string; to: string } | { from?: undefined; to?: undefined };

export type SyncAllOptions = {
  cursor?: number;
  limit?: number;
  maxPages?: number;
  onPage?: (data: SyncResponse) => Promise<void> | void;
} & SyncWindowOptions;

function parseRetryAfter(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 0) return n;
  const when = Date.parse(raw);
  if (Number.isNaN(when)) return undefined;
  return Math.max(0, Math.ceil((when - Date.now()) / 1000));
}

function extractRetryAfter(details: unknown): number | undefined {
  const d = details as Record<string, unknown> | undefined;
  if (!d) return undefined;
  if (typeof d.retryAfter === 'number') return d.retryAfter;
  if (typeof d.retry_after === 'number') return d.retry_after;
  return undefined;
}

export class OrthodoxCalendarApiClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly tokenStore: AdminTokenStore | undefined;
  private readonly defaultHeaders: Record<string, string>;

  constructor(baseUrl: string, options: OrthodoxCalendarApiClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    const providedFetch = options.fetchImpl;
    this.fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
      const f = providedFetch ?? globalThis.fetch;
      return f.call(globalThis, input, init);
    }) as typeof fetch;
    this.tokenStore = options.tokenStore;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  private static toQuery(params: Record<string, string | number | undefined>): string {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val === undefined) continue;
      qs.set(key, String(val));
    }
    const out = qs.toString();
    return out ? `?${out}` : '';
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      auth?: boolean;
      headers?: Record<string, string>;
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers ?? {}),
      Accept: 'application/json',
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.auth) {
      if (!this.tokenStore) {
        throw new Error('tokenStore is required for auth requests');
      }
      const token = await this.tokenStore.getToken();
      if (!token) {
        throw new BackendApiError('Missing admin token', 'UNAUTHORIZED', 401);
      }
      headers.Authorization = `Bearer ${token}`;
    }

    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      });
    } catch (e) {
      throw new BackendApiError(
        e instanceof Error ? e.message : 'Network request failed',
        'NETWORK_ERROR',
        0,
      );
    }

    const retryAfterHeader = parseRetryAfter(res.headers.get('Retry-After'));

    let json: ApiResponse<T> | null = null;
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch {
      if (!res.ok) {
        throw new BackendApiError(
          `HTTP ${res.status} without JSON body`,
          'HTTP_ERROR',
          res.status,
          undefined,
          retryAfterHeader,
        );
      }
      throw new BackendApiError('Expected JSON response', 'INVALID_RESPONSE', res.status);
    }

    if (!json.ok) {
      throw new BackendApiError(
        json.error.message,
        json.error.code,
        res.status,
        json.error.details,
        retryAfterHeader ?? extractRetryAfter(json.error.details),
      );
    }

    return json.data;
  }

  async health(): Promise<{ ok: true; service: string; ts: number }> {
    const res = await this.fetchImpl(`${this.baseUrl}/health`, { method: 'GET' });
    if (!res.ok) {
      throw new BackendApiError(`Health check failed with HTTP ${res.status}`, 'HTTP_ERROR', res.status);
    }
    return (await res.json()) as { ok: true; service: string; ts: number };
  }

  async clientConfig(): Promise<ClientConfigResponse> {
    return this.request<ClientConfigResponse>('GET', '/config/client');
  }

  async adminLogin(input: LoginRequest): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('POST', '/admin/login', { body: input });
    if (this.tokenStore) await this.tokenStore.setToken(data.token);
    return data;
  }

  async adminLogout(): Promise<{ message: string }> {
    const data = await this.request<{ message: string }>('DELETE', '/admin/logout', { auth: true });
    if (this.tokenStore) await this.tokenStore.setToken(null);
    return data;
  }

  async adminMe(): Promise<AdminMeResponse> {
    return this.request<AdminMeResponse>('GET', '/admin/me', { auth: true });
  }

  async listEvents(params: ListEventsParams = {}): Promise<ListEventsResponse> {
    const query = OrthodoxCalendarApiClient.toQuery({
      from: params.from,
      to: params.to,
      type: params.type,
      limit: params.limit,
      offset: params.offset,
    });
    return this.request<ListEventsResponse>('GET', `/events${query}`);
  }

  async getEvent(id: string): Promise<ApiEvent> {
    return this.request<ApiEvent>('GET', `/events/${encodeURIComponent(id)}`);
  }

  async createEvent(input: CreateEventInput): Promise<ApiEvent> {
    return this.request<ApiEvent>('POST', '/events', { body: input, auth: true });
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<ApiEvent> {
    return this.request<ApiEvent>('PUT', `/events/${encodeURIComponent(id)}`, {
      body: input,
      auth: true,
    });
  }

  async deleteEvent(id: string): Promise<{ id: string; deleted: true }> {
    return this.request<{ id: string; deleted: true }>('DELETE', `/events/${encodeURIComponent(id)}`, {
      auth: true,
    });
  }

  async sync(params: SyncParams = {}): Promise<SyncResponse> {
    const query = OrthodoxCalendarApiClient.toQuery({
      cursor: params.cursor,
      limit: params.limit,
      from: 'from' in params ? params.from : undefined,
      to: 'to' in params ? params.to : undefined,
    });
    return this.request<SyncResponse>('GET', `/sync${query}`);
  }

  async syncAll(options: SyncAllOptions = {}): Promise<SyncResponse[]> {
    const maxPages = options.maxPages ?? 50;
    const pages: SyncResponse[] = [];

    let cursor = options.cursor ?? 0;
    let hasMore = true;

    for (let page = 0; page < maxPages && hasMore; page++) {
      const params: SyncParams =
        options.from !== undefined && options.to !== undefined
          ? { cursor, limit: options.limit, from: options.from, to: options.to }
          : { cursor, limit: options.limit };

      const data = await this.sync(params);
      pages.push(data);
      await options.onPage?.(data);

      cursor = data.cursor;
      hasMore = data.hasMore;
    }

    if (hasMore) {
      throw new BackendApiError(
        `Sync stopped after maxPages=${maxPages} with hasMore=true`,
        'SYNC_TRUNCATED',
        500,
      );
    }

    return pages;
  }

  async syncAndPersistCursor(
    cursorStore: SyncCursorStore,
    options: Omit<SyncAllOptions, 'cursor'> = {},
  ): Promise<SyncResponse[]> {
    const cursor = await cursorStore.getCursor();
    const common = {
      cursor,
      limit: options.limit,
      maxPages: options.maxPages,
      onPage: async (page: SyncResponse) => {
        await options.onPage?.(page);
        await cursorStore.setCursor(page.cursor);
      },
    };

    const pages =
      options.from !== undefined && options.to !== undefined
        ? await this.syncAll({ ...common, from: options.from, to: options.to })
        : await this.syncAll(common);

    return pages;
  }

  async registerSubscription(
    input: RegisterSubscriptionInput,
  ): Promise<{ id: string; created?: true; updated?: true }> {
    return this.request<{ id: string; created?: true; updated?: true }>('POST', '/subscriptions', {
      body: input,
    });
  }

  async deleteSubscription(token: string): Promise<{ deleted: true }> {
    return this.request<{ deleted: true }>('DELETE', `/subscriptions/${encodeURIComponent(token)}`);
  }

  async notify(input: NotifyInput): Promise<NotifyResponse> {
    return this.request<NotifyResponse>('POST', '/subscriptions/notify', {
      body: input,
      auth: true,
    });
  }
}
