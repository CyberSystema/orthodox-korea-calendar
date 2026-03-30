import { apiClient } from './apiClient';
import { BackendApiError } from './sdk';
import type { AdminMeResponse, EventType, NotifyResponse } from './sdk';
import type { ApiEvent, RecurrenceFrequency } from './sdk';
import type { NotificationTarget, ParishEvent, Recurrence } from './types';

export { BackendApiError } from './sdk';

export interface AdminSessionData {
  token: string;
  expiresAt: number;
}

function mapEventType(type?: string): EventType {
  if (type === 'feast' || type === 'fast' || type === 'commemoration' || type === 'other') {
    return type;
  }
  return 'other';
}

function normalizeText(value: string | null | undefined): string {
  return (value || '').trim();
}

function normalizeIsoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : value;
}

export function toParishEvent(evt: ApiEvent): ParishEvent {
  const titleEn = normalizeText(evt.title?.en);
  const titleKo = normalizeText(evt.title?.ko);
  const descriptionEn = normalizeText(evt.description?.en);
  const descriptionKo = normalizeText(evt.description?.ko);
  const title = titleEn || titleKo;

  const recurrence: Recurrence =
    evt.recurrence?.frequency === 'daily' ||
    evt.recurrence?.frequency === 'weekly' ||
    evt.recurrence?.frequency === 'monthly'
      ? evt.recurrence.frequency
      : 'none';

  return {
    id: evt.id,
    date: normalizeIsoDate(evt.date),
    type: normalizeText(evt.type) || undefined,
    color: normalizeText(evt.color || undefined) || undefined,
    allDay: evt.allDay !== false,
    parentEventId: normalizeText(evt.parentEventId) || undefined,
    isOccurrence: Boolean(evt.isOccurrence),
    titleEn: titleEn || undefined,
    titleKo: titleKo || undefined,
    descriptionEn: descriptionEn || undefined,
    descriptionKo: descriptionKo || undefined,
    title,
    description: descriptionEn || descriptionKo,
    notify: false,
    notificationTarget: undefined,
    recurrence,
    recurrenceInterval:
      typeof evt.recurrence?.interval === 'number' && evt.recurrence.interval > 0
        ? evt.recurrence.interval
        : undefined,
    recurrenceUntil: normalizeText(evt.recurrence?.until) || undefined,
    createdAt: new Date(
      (evt.createdAt || evt.updatedAt || Math.floor(Date.now() / 1000)) * 1000,
    ).toISOString(),
  };
}

export async function fetchEventsRange(from: string, to: string): Promise<ParishEvent[]> {
  const data = await apiClient.listEvents({ from, to, limit: 500, offset: 0 });
  return (data.events || []).map(toParishEvent);
}

export async function loginAdmin(password: string): Promise<AdminSessionData> {
  return apiClient.adminLogin({ username: 'okn_admin', password });
}

export async function getAdminMe(): Promise<AdminMeResponse> {
  return apiClient.adminMe();
}

export async function logoutAdmin(): Promise<void> {
  await apiClient.adminLogout();
}

export async function getEventById(id: string): Promise<ParishEvent> {
  const event = await apiClient.getEvent(id);
  return toParishEvent(event);
}

export async function createEvent(data: {
  date: string;
  titleEn?: string;
  titleKo?: string;
  descriptionEn?: string;
  descriptionKo?: string;
  type?: string;
  color?: string;
  allDay?: boolean;
  recurrence?: {
    frequency: Exclude<Recurrence, 'none' | 'yearly'>;
    interval: number;
    until?: string;
  };
}): Promise<ParishEvent> {
  const titleEn = data.titleEn || '';
  const titleKo = data.titleKo || '';

  const payload = {
    date: data.date,
    type: mapEventType(data.type),
    color: data.color || '#8c1b1b',
    all_day: data.allDay ?? true,
    title_en: titleEn || titleKo || '(Untitled Event)',
    title_ko: titleKo || titleEn || '(행사)',
    description_en: data.descriptionEn || '',
    description_ko: data.descriptionKo || '',
    recurrence: undefined as
      | {
          frequency: RecurrenceFrequency;
          interval?: number;
          until?: string | null;
        }
      | null
      | undefined,
  };

  if (data.recurrence) {
    payload.recurrence = {
      frequency: data.recurrence.frequency as RecurrenceFrequency,
      interval: Math.max(1, data.recurrence.interval || 1),
      until: data.recurrence.until || null,
    };
  }

  const created = await apiClient.createEvent(payload);

  return toParishEvent(created);
}

export async function updateEvent(
  id: string,
  data: {
    date?: string;
    titleEn?: string;
    titleKo?: string;
    descriptionEn?: string;
    descriptionKo?: string;
    type?: string;
    color?: string;
    allDay?: boolean;
    recurrence?: {
      frequency: Exclude<Recurrence, 'none' | 'yearly'>;
      interval: number;
      until?: string;
    } | null;
  },
): Promise<ParishEvent> {
  const payload: Record<string, unknown> = {};
  if (data.date !== undefined) payload.date = data.date;
  if (data.type !== undefined) payload.type = data.type;
  if (data.color !== undefined) payload.color = data.color;
  if (data.allDay !== undefined) payload.all_day = data.allDay;
  if (data.titleEn !== undefined) payload.title_en = data.titleEn;
  if (data.titleKo !== undefined) payload.title_ko = data.titleKo;
  if (data.descriptionEn !== undefined) payload.description_en = data.descriptionEn;
  if (data.descriptionKo !== undefined) payload.description_ko = data.descriptionKo;
  if (data.recurrence !== undefined) {
    payload.recurrence =
      data.recurrence === null
        ? null
        : {
            frequency: data.recurrence.frequency as RecurrenceFrequency,
            interval: Math.max(1, data.recurrence.interval || 1),
            until: data.recurrence.until || null,
          };
  }

  const updated = await apiClient.updateEvent(id, payload as any);

  return toParishEvent(updated);
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.deleteEvent(id);
}

function mapNotificationTarget(target: NotificationTarget): 'all' | 'en' | 'ko' {
  if (target === 'english') return 'en';
  if (target === 'korean') return 'ko';
  return 'all';
}

export async function notifySubscribers(params: {
  eventId: string;
  target: NotificationTarget;
}): Promise<NotifyResponse> {
  const hasToken = await apiClient.hasAdminToken();
  if (!hasToken) {
    throw new BackendApiError('Please sign in first.', 'UNAUTHORIZED', 401);
  }

  const event = await getEventById(params.eventId);
  return apiClient.notify({
    target: mapNotificationTarget(params.target),
    title_en: event.titleEn || event.title || '(Untitled Event)',
    title_ko: event.titleKo || event.title || '(행사)',
    body_en: event.descriptionEn || '',
    body_ko: event.descriptionKo || '',
    data: {
      eventId: event.id,
      date: event.date,
    },
  });
}

export async function registerSubscription(
  token: string,
  language: 'en' | 'ko' | 'all',
): Promise<void> {
  await apiClient.registerSubscription({
    token,
    language,
    platform: 'web',
  });
}

export async function unregisterSubscription(token: string): Promise<void> {
  await apiClient.deleteSubscription(token);
}

export async function runSync(
  onChunk: (chunk: { events: ParishEvent[]; deletedIds: string[] }) => void,
  options?: { from?: string; to?: string },
): Promise<{ cursor: number; hasChanges: boolean }> {
  let hasChanges = false;
  let lastCursor = 0;

  await apiClient.syncAndPersistCursor(
    {
      async getCursor() {
        const raw = localStorage.getItem('okc_sync_cursor');
        const value = Number.parseInt(raw || '0', 10);
        return Number.isFinite(value) && value >= 0 ? value : 0;
      },
      async setCursor(cursor: number) {
        localStorage.setItem('okc_sync_cursor', String(Math.max(0, Math.floor(cursor))));
      },
    },
    {
      ...(options?.from && options?.to ? { from: options.from, to: options.to } : {}),
      maxPages: 100,
      onPage: (data) => {
        lastCursor = data.cursor;
        const normalizedEvents = (data.events || []).map(toParishEvent);
        const deletedIds = data.deletedIds || [];
        if (normalizedEvents.length > 0 || deletedIds.length > 0) {
          onChunk({ events: normalizedEvents, deletedIds });
          hasChanges = true;
        }
      },
    },
  );

  return { cursor: lastCursor, hasChanges };
}
