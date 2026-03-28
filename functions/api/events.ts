/// <reference path="../types.d.ts" />

interface Env {
  EVENTS: KVNamespace;
  ADMIN_PASSCODE: string;
  ONESIGNAL_APP_ID: string;
  ONESIGNAL_API_KEY: string;
}

interface ParishEvent {
  id: string;
  date: string;
  seriesStartDate?: string;
  titleEn?: string;
  titleKo?: string;
  descriptionEn?: string;
  descriptionKo?: string;
  title: string;
  description: string;
  notify: boolean;
  notificationTarget?: NotificationTarget;
  recurrence: Recurrence;
  createdAt: string;
}

type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type NotificationTarget = 'all' | 'english' | 'korean';

interface StoredParishEvent {
  id: string;
  date: string;
  titleEn?: unknown;
  titleKo?: unknown;
  descriptionEn?: unknown;
  descriptionKo?: unknown;
  title: string;
  description: string;
  notify: boolean;
  notificationTarget?: unknown;
  recurrence?: unknown;
  yearly?: unknown;
  createdAt: string;
}

interface CreateEventBody {
  passcode: string;
  date: string;
  title?: string;
  description?: string;
  titleEn?: string;
  titleKo?: string;
  descriptionEn?: string;
  descriptionKo?: string;
  notify?: boolean;
  notificationTarget?: NotificationTarget;
  recurrence?: unknown;
  yearly?: boolean;
}

interface UpdateEventBody {
  passcode: string;
  id: string;
  date: string;
  title?: string;
  description?: string;
  titleEn?: string;
  titleKo?: string;
  descriptionEn?: string;
  descriptionKo?: string;
  notify?: boolean;
  notificationTarget?: NotificationTarget;
  recurrence?: unknown;
  yearly?: boolean;
  originalYear?: number;
}

type EventLookupResult =
  | { scope: 'year'; year: number; events: ParishEvent[]; index: number }
  | { scope: 'recurring'; events: ParishEvent[]; index: number };

interface DeleteEventBody {
  passcode: string;
  id: string;
  year: number;
}

interface VerifyBody {
  passcode: string;
}

interface SanitizedEventInput {
  year: number;
  titleEn: string;
  titleKo: string;
  descriptionEn: string;
  descriptionKo: string;
  title: string;
  description: string;
  recurrence: Recurrence;
}

interface SanitizedEventInputError {
  error: string;
}

interface NotificationResult {
  attempted: boolean;
  sent: boolean;
  status?: number;
  response?: unknown;
  reason?: string;
  immediate?: {
    attempted: boolean;
    sent: boolean;
    status?: number;
    response?: unknown;
    reason?: string;
  };
  scheduled?: {
    attempted: boolean;
    sent: boolean;
    status?: number;
    response?: unknown;
    reason?: string;
    scheduledFor?: string;
  };
}

type OneSignalAudience =
  | { type: 'segments'; segments: string[] }
  | {
      type: 'filters';
      filters: Array<{ field: 'tag'; key: string; relation: '=' | '!='; value: string }>;
    };

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const MAX_TITLE_LEN = 160;
const MAX_DESC_LEN = 2000;
const RATE_LIMIT_WINDOW_SEC = 10 * 60;
const RATE_LIMIT_MAX_ATTEMPTS = 20;
const RECURRING_EVENTS_KEY = 'events:recurring';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

function checkPasscode(passcode: string, env: Env): boolean {
  return passcode === env.ADMIN_PASSCODE;
}

function isValidYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() + 1 === m && dt.getUTCDate() === d;
}

function parseYearFromISODate(value: string): number {
  return Number.parseInt(value.slice(0, 4), 10);
}

function parseMonthFromISODate(value: string): number {
  return Number.parseInt(value.slice(5, 7), 10);
}

function parseDayFromISODate(value: string): number {
  return Number.parseInt(value.slice(8, 10), 10);
}

function buildISODate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateToUtcMs(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(value: string, days: number): string {
  const dt = new Date(dateToUtcMs(value));
  dt.setUTCDate(dt.getUTCDate() + days);
  return buildISODate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function normalizeRecurrence(raw: unknown, legacyYearly?: unknown): Recurrence {
  if (
    raw === 'none' ||
    raw === 'daily' ||
    raw === 'weekly' ||
    raw === 'monthly' ||
    raw === 'yearly'
  ) {
    return raw;
  }
  return legacyYearly === true ? 'yearly' : 'none';
}

function normalizeStoredEvent(raw: StoredParishEvent): ParishEvent | null {
  const titleEn = typeof raw.titleEn === 'string' ? raw.titleEn.trim() : '';
  const titleKo = typeof raw.titleKo === 'string' ? raw.titleKo.trim() : '';
  const descriptionEn = typeof raw.descriptionEn === 'string' ? raw.descriptionEn.trim() : '';
  const descriptionKo = typeof raw.descriptionKo === 'string' ? raw.descriptionKo.trim() : '';
  const legacyTitle = typeof raw.title === 'string' ? raw.title.trim() : '';
  const legacyDescription = typeof raw.description === 'string' ? raw.description.trim() : '';
  const title = titleEn || titleKo || legacyTitle;
  const description = descriptionEn || descriptionKo || legacyDescription;

  if (
    !raw ||
    typeof raw.id !== 'string' ||
    typeof raw.date !== 'string' ||
    typeof raw.notify !== 'boolean' ||
    typeof raw.createdAt !== 'string' ||
    !isValidISODate(raw.date) ||
    !title
  ) {
    return null;
  }

  const notificationTarget: NotificationTarget =
    raw.notificationTarget === 'english' || raw.notificationTarget === 'korean'
      ? raw.notificationTarget
      : 'all';

  return {
    id: raw.id,
    date: raw.date,
    titleEn: titleEn || undefined,
    titleKo: titleKo || undefined,
    descriptionEn: descriptionEn || undefined,
    descriptionKo: descriptionKo || undefined,
    title,
    description,
    notify: raw.notify,
    notificationTarget,
    recurrence: normalizeRecurrence(raw.recurrence, raw.yearly),
    createdAt: raw.createdAt,
  };
}

function parseStoredEvents(raw: string | null): ParishEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredParishEvent[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((event) => {
      const normalized = normalizeStoredEvent(event);
      return normalized ? [normalized] : [];
    });
  } catch {
    return [];
  }
}

async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function denyPasscode() {
  return errorResponse('Invalid passcode', 403);
}

function getRateLimitBucket(now = Date.now()): number {
  return Math.floor(now / (RATE_LIMIT_WINDOW_SEC * 1000));
}

function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function getRateLimitKey(ip: string, bucket: number): string {
  return `auth-fail:${ip}:${bucket}`;
}

async function getFailureCount(request: Request, env: Env): Promise<number> {
  const ip = getClientIP(request);
  const bucket = getRateLimitBucket();
  const raw = await env.EVENTS.get(getRateLimitKey(ip, bucket));
  const count = Number.parseInt(raw || '0', 10);
  return Number.isFinite(count) ? count : 0;
}

async function incrementFailureCount(request: Request, env: Env): Promise<void> {
  const ip = getClientIP(request);
  const bucket = getRateLimitBucket();
  const key = getRateLimitKey(ip, bucket);
  const current = await getFailureCount(request, env);
  await env.EVENTS.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SEC + 60,
  });
}

async function assertAuthAttemptsAllowed(request: Request, env: Env): Promise<Response | null> {
  const failures = await getFailureCount(request, env);
  if (failures >= RATE_LIMIT_MAX_ATTEMPTS) {
    return errorResponse('Too many failed attempts. Please try again later.', 429);
  }
  return null;
}

async function denyPasscodeWithRateLimit(request: Request, env: Env): Promise<Response> {
  await incrementFailureCount(request, env);
  // Small delay to make brute-force attempts less efficient.
  await new Promise((resolve) => setTimeout(resolve, 350));
  return denyPasscode();
}

function getEventIndexKey(id: string): string {
  return `event-year-index:${id}`;
}

async function getIndexedYearForEvent(id: string, env: Env): Promise<number | null> {
  const raw = await env.EVENTS.get(getEventIndexKey(id));
  if (!raw) return null;
  const year = Number.parseInt(raw, 10);
  return isValidYear(year) ? year : null;
}

async function setIndexedYearForEvent(id: string, year: number, env: Env): Promise<void> {
  await env.EVENTS.put(getEventIndexKey(id), String(year));
}

async function clearIndexedYearForEvent(id: string, env: Env): Promise<void> {
  await env.EVENTS.delete(getEventIndexKey(id));
}

function sanitizeEventInput(
  date: string,
  titleEn?: string,
  titleKo?: string,
  descriptionEn?: string,
  descriptionKo?: string,
  legacyTitle?: string,
  legacyDescription?: string,
  recurrenceRaw?: unknown,
  legacyYearly?: boolean,
): SanitizedEventInput | SanitizedEventInputError {
  const trimmedTitleEn = (titleEn || '').trim();
  const trimmedTitleKo = (titleKo || '').trim();
  const trimmedDescriptionEn = (descriptionEn || '').trim();
  const trimmedDescriptionKo = (descriptionKo || '').trim();
  const trimmedLegacyTitle = (legacyTitle || '').trim();
  const trimmedLegacyDescription = (legacyDescription || '').trim();

  const finalTitleEn = trimmedTitleEn;
  const finalTitleKo = trimmedTitleKo || (!trimmedTitleEn ? trimmedLegacyTitle : '');
  const finalDescriptionEn = trimmedDescriptionEn;
  const finalDescriptionKo =
    trimmedDescriptionKo || (!trimmedDescriptionEn ? trimmedLegacyDescription : '');

  const primaryTitle = finalTitleEn || finalTitleKo || trimmedLegacyTitle;
  const primaryDescription = finalDescriptionEn || finalDescriptionKo || trimmedLegacyDescription;
  const recurrence = normalizeRecurrence(recurrenceRaw, legacyYearly);

  if (!isValidISODate(date)) {
    return { error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }
  if (!primaryTitle) {
    return { error: 'At least one title is required (English or Korean).' };
  }
  if (finalTitleEn.length > MAX_TITLE_LEN || finalTitleKo.length > MAX_TITLE_LEN) {
    return { error: `Title is too long (max ${MAX_TITLE_LEN} chars per language).` };
  }
  if (finalDescriptionEn.length > MAX_DESC_LEN || finalDescriptionKo.length > MAX_DESC_LEN) {
    return { error: `Description is too long (max ${MAX_DESC_LEN} chars per language).` };
  }

  const year = parseYearFromISODate(date);
  if (!isValidYear(year)) {
    return { error: 'Year out of supported range.' };
  }

  return {
    year,
    titleEn: finalTitleEn,
    titleKo: finalTitleKo,
    descriptionEn: finalDescriptionEn,
    descriptionKo: finalDescriptionKo,
    title: primaryTitle,
    description: primaryDescription,
    recurrence,
  };
}

function titleForLang(event: ParishEvent, lang: 'en' | 'ko'): string {
  if (lang === 'ko') return event.titleKo || event.titleEn || event.title;
  return event.titleEn || event.titleKo || event.title;
}

function extractOneSignalApiReason(payload: unknown): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'errors' in payload &&
    Array.isArray((payload as { errors?: unknown[] }).errors) &&
    (payload as { errors?: unknown[] }).errors?.length
  ) {
    return String((payload as { errors?: unknown[] }).errors?.[0]);
  }
  return 'OneSignal API returned non-2xx';
}

async function getEvents(year: number, env: Env): Promise<ParishEvent[]> {
  const raw = await env.EVENTS.get(`events:${year}`);
  return parseStoredEvents(raw);
}

async function saveEvents(year: number, events: ParishEvent[], env: Env) {
  await env.EVENTS.put(`events:${year}`, JSON.stringify(events));
}

async function getRecurringEvents(env: Env): Promise<ParishEvent[]> {
  const raw = await env.EVENTS.get(RECURRING_EVENTS_KEY);
  return parseStoredEvents(raw);
}

async function saveRecurringEvents(events: ParishEvent[], env: Env) {
  await env.EVENTS.put(RECURRING_EVENTS_KEY, JSON.stringify(events));
}

function projectRecurringEvents(year: number, events: ParishEvent[]): ParishEvent[] {
  const startOfYear = buildISODate(year, 1, 1);
  const endOfYear = buildISODate(year, 12, 31);

  return events.flatMap((event) => {
    const eventYear = parseYearFromISODate(event.date);
    const eventMonth = parseMonthFromISODate(event.date);
    const eventDay = parseDayFromISODate(event.date);

    if (event.recurrence === 'none' || year < eventYear) {
      return [];
    }

    if (event.recurrence === 'yearly') {
      const occurrenceDate = buildISODate(year, eventMonth, eventDay);
      return isValidISODate(occurrenceDate)
        ? [{ ...event, date: occurrenceDate, seriesStartDate: event.date }]
        : [];
    }

    if (event.recurrence === 'monthly') {
      const startMonth = year === eventYear ? eventMonth : 1;
      const projected: ParishEvent[] = [];
      for (let month = startMonth; month <= 12; month += 1) {
        const occurrenceDate = buildISODate(year, month, eventDay);
        if (!isValidISODate(occurrenceDate)) continue;
        if (occurrenceDate < event.date) continue;
        projected.push({ ...event, date: occurrenceDate, seriesStartDate: event.date });
      }
      return projected;
    }

    if (event.recurrence === 'weekly') {
      let occurrenceDate = event.date;
      while (occurrenceDate < startOfYear) {
        occurrenceDate = addDays(occurrenceDate, 7);
      }

      const projected: ParishEvent[] = [];
      while (occurrenceDate <= endOfYear) {
        projected.push({ ...event, date: occurrenceDate, seriesStartDate: event.date });
        occurrenceDate = addDays(occurrenceDate, 7);
      }
      return projected;
    }

    let occurrenceDate = event.date < startOfYear ? startOfYear : event.date;
    const projected: ParishEvent[] = [];
    while (occurrenceDate <= endOfYear) {
      projected.push({ ...event, date: occurrenceDate, seriesStartDate: event.date });
      occurrenceDate = addDays(occurrenceDate, 1);
    }
    return projected;
  });
}

function sortEvents(events: ParishEvent[]): ParishEvent[] {
  return [...events].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.title.localeCompare(b.title) ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

async function findEventById(
  id: string,
  preferredYear: number | null,
  env: Env,
): Promise<EventLookupResult | null> {
  const recurringEvents = await getRecurringEvents(env);
  const recurringIndex = recurringEvents.findIndex((event) => event.id === id);
  if (recurringIndex !== -1) {
    return { scope: 'recurring', events: recurringEvents, index: recurringIndex };
  }

  const nowYear = new Date().getFullYear();
  const years: number[] = [];

  if (preferredYear !== null && isValidYear(preferredYear)) {
    years.push(preferredYear);
  }
  const indexedYear = await getIndexedYearForEvent(id, env);
  if (indexedYear !== null && !years.includes(indexedYear)) {
    years.push(indexedYear);
  }
  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
    if (!years.includes(y)) years.push(y);
  }
  if (!years.includes(nowYear) && isValidYear(nowYear)) {
    years.unshift(nowYear);
  }

  for (const year of years) {
    const events = await getEvents(year, env);
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
      if (indexedYear !== year) {
        await setIndexedYearForEvent(id, year, env);
      }
      return { scope: 'year', year, events, index };
    }
  }

  return null;
}

function calculateDaysBetween(createdAt: string, eventDate: string): number {
  const created = new Date(createdAt);
  const event = new Date(dateToUtcMs(eventDate)); // UTC-safe, consistent with dateToUtcMs helper
  const diffTime = event.getTime() - created.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getUnixTimestampForKST(
  date: string,
  hours: number,
  minutes: number,
  seconds: number,
): number {
  // Parse YYYY-MM-DD format
  const [year, month, day] = date.split('-').map(Number);

  // Create date in KST by creating UTC date and accounting for KST offset (UTC+9)
  // We want: date at HH:MM:SS in KST = UTC time - 9 hours
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 9, minutes, seconds));

  // Return Unix timestamp in seconds
  return Math.floor(utcDate.getTime() / 1000);
}

async function sendOneSignalNotification(
  appId: string,
  apiKey: string,
  messageEn: string,
  messageKo: string,
  url: string,
  audience: OneSignalAudience = { type: 'segments', segments: ['All'] },
  sendAfter?: number,
): Promise<{
  attempted: boolean;
  sent: boolean;
  status?: number;
  response?: unknown;
  reason?: string;
  scheduledFor?: string;
}> {
  const body: Record<string, unknown> = {
    app_id: appId,
    headings: { en: '♱ Orthodox Korea', ko: '♱ 정교회 한국' },
    contents: {
      en: messageEn,
      ko: messageKo,
    },
    url,
  };

  if (audience.type === 'filters') {
    body.filters = audience.filters;
  } else {
    body.included_segments = audience.segments.length > 0 ? audience.segments : ['All'];
  }

  if (sendAfter !== undefined) {
    // OneSignal v1 REST API expects a datetime string, not a Unix timestamp integer.
    body.send_after = new Date(sendAfter * 1000).toISOString();
  }

  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = await res.text().catch(() => '');
    }

    if (!res.ok) {
      return {
        attempted: true,
        sent: false,
        status: res.status,
        response: payload,
        reason: extractOneSignalApiReason(payload),
      };
    }

    return {
      attempted: true,
      sent: true,
      status: res.status,
      response: payload,
      scheduledFor: sendAfter !== undefined ? new Date(sendAfter * 1000).toISOString() : undefined,
    };
  } catch (err) {
    return {
      attempted: true,
      sent: false,
      reason: err instanceof Error ? err.message : 'Unknown push error',
    };
  }
}

async function sendNotification(event: ParishEvent, env: Env): Promise<NotificationResult> {
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
    return {
      attempted: false,
      sent: false,
      reason: 'OneSignal credentials missing in environment',
    };
  }

  // Determine audience based on notificationTarget.
  // For language-specific sends, target the user tag directly to avoid
  // dependency on dashboard segment names.
  const target = event.notificationTarget ?? 'all';
  let audience: OneSignalAudience = { type: 'segments', segments: ['All'] };

  if (target === 'english') {
    audience = {
      type: 'filters',
      filters: [{ field: 'tag', key: 'language', relation: '=', value: 'en' }],
    };
  } else if (target === 'korean') {
    // Keep Korean targeting to a single tag filter to avoid API schema edge cases.
    // Subscribers are tagged language=ko in src/lib/onesignal.ts.
    audience = {
      type: 'filters',
      filters: [{ field: 'tag', key: 'language', relation: '=', value: 'ko' }],
    };
  }

  const dateObj = new Date(event.date + 'T00:00:00');
  const dateFormattedEn = dateObj.toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const dateFormattedKo = dateObj.toLocaleDateString('ko', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const url = `https://orthodox-korea-calendar.pages.dev/?event=${encodeURIComponent(event.id)}&date=${encodeURIComponent(event.date)}`;
  const messageEn = `${titleForLang(event, 'en')} — ${dateFormattedEn}`;
  const messageKo = `${titleForLang(event, 'ko')} — ${dateFormattedKo}`;

  // Send immediate notification
  const immediate = await sendOneSignalNotification(
    env.ONESIGNAL_APP_ID,
    env.ONESIGNAL_API_KEY,
    messageEn,
    messageKo,
    url,
    audience,
  );

  // result.sent reflects only the immediate notification — whether the user's
  // explicit "send now" request succeeded. The day-before reminder is a bonus
  // feature; its failure should not mask a successful immediate delivery.
  const result: NotificationResult = {
    attempted: immediate.attempted,
    sent: immediate.sent,
    status: immediate.status,
    response: immediate.response,
    reason: immediate.reason,
    immediate,
  };

  // Check if we should send a day-before reminder notification
  const daysBetween = calculateDaysBetween(event.createdAt, event.date);
  if (daysBetween > 1) {
    // Use the UTC-safe addDays utility to get the day before
    const dayBeforeDateStr = addDays(event.date, -1);

    // Get Unix timestamp for 9 AM KST on the day before
    const sendAfterTimestamp = getUnixTimestampForKST(dayBeforeDateStr, 9, 0, 0);

    const reminderMessageEn = `Reminder: ${titleForLang(event, 'en')} — ${dateFormattedEn}`;
    const reminderMessageKo = `알림: ${titleForLang(event, 'ko')} — ${dateFormattedKo}`;

    const scheduled = await sendOneSignalNotification(
      env.ONESIGNAL_APP_ID,
      env.ONESIGNAL_API_KEY,
      reminderMessageEn,
      reminderMessageKo,
      url,
      audience,
      sendAfterTimestamp,
    );

    result.scheduled = scheduled;
    // Note: result.sent is NOT ANDed here — reminder failure does not
    // mean the immediate notification failed.
  }

  return result;
}

// ── GET /api/events?year=2026 ──
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const rawYear = url.searchParams.get('year') || String(new Date().getFullYear());
  const year = Number.parseInt(rawYear, 10);
  if (!isValidYear(year)) return errorResponse('Invalid year');

  const [events, recurringEvents] = await Promise.all([
    getEvents(year, env),
    getRecurringEvents(env),
  ]);
  return jsonResponse(sortEvents([...events, ...projectRecurringEvents(year, recurringEvents)]));
};

// ── PATCH /api/events ── (verify passcode)
export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const blocked = await assertAuthAttemptsAllowed(request, env);
  if (blocked) return blocked;

  const body = await readJsonBody<VerifyBody>(request);
  if (!body?.passcode) return errorResponse('Passcode is required');

  if (!checkPasscode(body.passcode, env)) {
    return denyPasscodeWithRateLimit(request, env);
  }

  return jsonResponse({ ok: true });
};

// ── POST /api/events ── (create)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const blocked = await assertAuthAttemptsAllowed(request, env);
  if (blocked) return blocked;

  const body = await readJsonBody<CreateEventBody>(request);
  if (!body) return errorResponse('Invalid JSON body');

  if (!checkPasscode(body.passcode, env)) {
    return denyPasscodeWithRateLimit(request, env);
  }
  if (!body.date) {
    return errorResponse('Date is required');
  }

  const normalized = sanitizeEventInput(
    body.date,
    body.titleEn,
    body.titleKo,
    body.descriptionEn,
    body.descriptionKo,
    body.title,
    body.description,
    body.recurrence,
    body.yearly,
  );
  if ('error' in normalized) return errorResponse(normalized.error);

  const year = normalized.year;
  const event: ParishEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    date: body.date,
    titleEn: normalized.titleEn || undefined,
    titleKo: normalized.titleKo || undefined,
    descriptionEn: normalized.descriptionEn || undefined,
    descriptionKo: normalized.descriptionKo || undefined,
    title: normalized.title,
    description: normalized.description,
    notify: body.notify ?? true,
    notificationTarget: body.notificationTarget ?? 'all',
    recurrence: normalized.recurrence,
    createdAt: new Date().toISOString(),
  };

  if (event.recurrence !== 'none') {
    const recurringEvents = await getRecurringEvents(env);
    recurringEvents.push(event);
    await Promise.all([
      saveRecurringEvents(recurringEvents, env),
      clearIndexedYearForEvent(event.id, env),
    ]);
  } else {
    const events = await getEvents(year, env);
    events.push(event);
    await Promise.all([saveEvents(year, events, env), setIndexedYearForEvent(event.id, year, env)]);
  }

  // Send push notification
  let notification: NotificationResult = {
    attempted: false,
    sent: false,
    reason: 'Notification disabled for this event',
  };
  if (event.notify) {
    notification = await sendNotification(event, env);
  }

  return jsonResponse({ event, notification }, 201);
};

// ── PUT /api/events ── (update)
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const blocked = await assertAuthAttemptsAllowed(request, env);
  if (blocked) return blocked;

  const body = await readJsonBody<UpdateEventBody>(request);
  if (!body) return errorResponse('Invalid JSON body');

  if (!checkPasscode(body.passcode, env)) {
    return denyPasscodeWithRateLimit(request, env);
  }
  if (!body.id || !body.date) {
    return errorResponse('ID and date are required');
  }

  const normalized = sanitizeEventInput(
    body.date,
    body.titleEn,
    body.titleKo,
    body.descriptionEn,
    body.descriptionKo,
    body.title,
    body.description,
    body.recurrence,
    body.yearly,
  );
  if ('error' in normalized) return errorResponse(normalized.error);

  const match = await findEventById(body.id, body.originalYear ?? null, env);
  if (!match) return errorResponse('Event not found', 404);

  const toYear = normalized.year;
  const updatedEvent: ParishEvent = {
    ...match.events[match.index],
    date: body.date,
    titleEn: normalized.titleEn || undefined,
    titleKo: normalized.titleKo || undefined,
    descriptionEn: normalized.descriptionEn || undefined,
    descriptionKo: normalized.descriptionKo || undefined,
    title: normalized.title,
    description: normalized.description,
    recurrence: normalized.recurrence,
    notificationTarget:
      body.notificationTarget ?? match.events[match.index].notificationTarget ?? 'all',
  };

  if (match.scope === 'recurring') {
    const recurringEvents = [...match.events];
    recurringEvents[match.index] = updatedEvent;

    if (updatedEvent.recurrence !== 'none') {
      await Promise.all([
        saveRecurringEvents(recurringEvents, env),
        clearIndexedYearForEvent(updatedEvent.id, env),
      ]);
    } else {
      const toEvents = await getEvents(toYear, env);
      toEvents.push(updatedEvent);
      recurringEvents.splice(match.index, 1);
      await Promise.all([
        saveRecurringEvents(recurringEvents, env),
        saveEvents(toYear, toEvents, env),
        setIndexedYearForEvent(updatedEvent.id, toYear, env),
      ]);
    }

    return jsonResponse(updatedEvent);
  }

  const fromYear = match.year;

  if (updatedEvent.recurrence !== 'none') {
    const fromEvents = match.events.filter((_, i) => i !== match.index);
    const recurringEvents = await getRecurringEvents(env);
    recurringEvents.push(updatedEvent);
    await Promise.all([
      saveEvents(fromYear, fromEvents, env),
      saveRecurringEvents(recurringEvents, env),
      clearIndexedYearForEvent(updatedEvent.id, env),
    ]);
  } else if (fromYear === toYear) {
    match.events[match.index] = updatedEvent;
    await Promise.all([
      saveEvents(toYear, match.events, env),
      setIndexedYearForEvent(updatedEvent.id, toYear, env),
    ]);
  } else {
    const fromEvents = match.events.filter((_, i) => i !== match.index);
    const toEvents = await getEvents(toYear, env);
    toEvents.push(updatedEvent);
    await Promise.all([
      saveEvents(fromYear, fromEvents, env),
      saveEvents(toYear, toEvents, env),
      setIndexedYearForEvent(updatedEvent.id, toYear, env),
    ]);
  }

  return jsonResponse(updatedEvent);
};

// ── DELETE /api/events ── (delete)
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const blocked = await assertAuthAttemptsAllowed(request, env);
  if (blocked) return blocked;

  const body = await readJsonBody<DeleteEventBody>(request);
  if (!body) return errorResponse('Invalid JSON body');

  if (!checkPasscode(body.passcode, env)) {
    return denyPasscodeWithRateLimit(request, env);
  }
  if (!body.id) return errorResponse('ID is required');

  const preferredYear = Number.isFinite(body.year) ? Number(body.year) : null;
  const match = await findEventById(body.id, preferredYear, env);
  if (!match) return errorResponse('Event not found', 404);

  const filtered = match.events.filter((e) => e.id !== body.id);
  if (match.scope === 'recurring') {
    await Promise.all([saveRecurringEvents(filtered, env), clearIndexedYearForEvent(body.id, env)]);
  } else {
    await Promise.all([
      saveEvents(match.year, filtered, env),
      clearIndexedYearForEvent(body.id, env),
    ]);
  }
  return jsonResponse({ deleted: true });
};
