export type EventType = 'feast' | 'fast' | 'commemoration' | 'other';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';
export type Platform = 'ios' | 'android' | 'web';
export type Language = 'en' | 'ko' | 'all';
export type NotificationTarget = 'all' | 'en' | 'ko';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiError;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  until: string | null;
}

export interface ApiEvent {
  id: string;
  parentEventId?: string;
  isOccurrence?: boolean;
  title: { en: string; ko: string };
  description: { en: string; ko: string };
  date: string;
  type: EventType;
  color: string | null;
  recurrence?: EventRecurrence;
  allDay: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
}

export interface AdminMeResponse {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
}

export interface ListEventsParams {
  from?: string;
  to?: string;
  type?: EventType;
  limit?: number;
  offset?: number;
}

export interface ListEventsResponse {
  events: ApiEvent[];
  limit: number;
  offset: number;
  count: number;
}

export interface CreateOrUpdateEventInput {
  title_en?: string;
  title_ko?: string;
  description_en?: string;
  description_ko?: string;
  date?: string;
  type?: EventType;
  color?: string | null;
  all_day?: boolean;
  recurrence?:
    | {
        frequency: RecurrenceFrequency;
        interval?: number;
        until?: string | null;
      }
    | null;
}

export type CreateEventInput = CreateOrUpdateEventInput;
export type UpdateEventInput = CreateOrUpdateEventInput;

export type SyncParams =
  | {
      cursor?: number;
      limit?: number;
      from?: undefined;
      to?: undefined;
    }
  | {
      cursor?: number;
      limit?: number;
      from: string;
      to: string;
    };

export interface SyncResponse {
  cursor: number;
  hasMore: boolean;
  events: ApiEvent[];
  deletedIds: string[];
}

export interface RegisterSubscriptionInput {
  token: string;
  platform: Platform;
  language?: Language;
}

export interface NotifyInput {
  target: NotificationTarget;
  title_en: string;
  title_ko: string;
  body_en?: string;
  body_ko?: string;
  data?: Record<string, string>;
}

export interface NotifyResponse {
  sent: number;
  failed: number;
  total: number;
  target: NotificationTarget;
  fcmEnabled: boolean;
  fcmMode: 'legacy' | 'disabled';
  message?: string;
}

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidPublicKey: string;
}

export interface ClientConfigResponse {
  firebase: FirebaseClientConfig;
}
