import { writable, get } from 'svelte/store';
import type { DayData, Language, ParishEvent } from './types';
import { fetchYear } from './api';
import { BackendApiError, fetchEventsRange, getAdminMe, logoutAdmin, runSync } from './events';

// ── Per-year calendar data cache ──
export const cacheEN = writable<Record<number, DayData[]>>({});
export const cacheKR = writable<Record<number, DayData[]>>({});
export const unavailableYears = writable<Set<number>>(new Set());
const loadingYears = new Set<string>();

// ── Parish events cache ──
export const eventsCache = writable<Record<number, ParishEvent[]>>({});
const allEventsById = writable<Record<string, ParishEvent>>({});
export const syncInProgress = writable(false);
export const syncError = writable<string>('');
const hydratedYears = new Set<number>();
const loadingEventYears = new Set<number>();
const syncWindowCache = new Map<string, { syncedAt: number; cursor: number }>();
const SYNC_WINDOW_CACHE_TTL_MS = 60_000;

// ── Admin state ──
export const isAdmin = writable(false);
// Backward-compatible wrappers kept for existing call sites.
export function getPasscode(): string {
  return sessionStorage.getItem('okc_admin_token') || '';
}
export function setPasscode(code: string) {
  sessionStorage.setItem('okc_admin_token', code);
}
export function clearPasscode() {
  sessionStorage.removeItem('okc_admin_token');
}

function groupByYear(events: ParishEvent[]): Record<number, ParishEvent[]> {
  const grouped: Record<number, ParishEvent[]> = {};
  for (const evt of events) {
    const year = Number.parseInt(evt.date.slice(0, 4), 10);
    if (!Number.isFinite(year)) continue;
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(evt);
  }

  for (const year of Object.keys(grouped)) {
    grouped[Number(year)].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.id.localeCompare(b.id);
    });
  }

  return grouped;
}

function rebuildEventsCache() {
  const all = Object.values(get(allEventsById));
  eventsCache.set(groupByYear(all));
}

function applySyncChunk(chunk: { events: ParishEvent[]; deletedIds: string[] }) {
  allEventsById.update((current) => {
    const next = { ...current };
    for (const id of chunk.deletedIds) {
      delete next[id];
    }
    for (const evt of chunk.events) {
      next[evt.id] = evt;
    }
    return next;
  });
  rebuildEventsCache();
}

function formatRateLimitMessage(retryAfter?: number): string {
  if (retryAfter === undefined) return 'Too many requests. Please try again shortly.';
  if (retryAfter < 60) return `Too many requests. Try again in ${retryAfter}s.`;
  return `Too many requests. Try again in ${Math.ceil(retryAfter / 60)}m.`;
}

export async function syncEventsNow(): Promise<void> {
  await syncEventsForYear(get(currentYear));
}

function windowKey(from: string, to: string): string {
  return `${from}:${to}`;
}

export async function syncEventsForYear(
  year: number,
  options: { force?: boolean } = {},
): Promise<void> {
  const from = `${String(year).padStart(4, '0')}-01-01`;
  const to = `${String(year + 1).padStart(4, '0')}-12-31`;
  const key = windowKey(from, to);

  if (!options.force) {
    const cached = syncWindowCache.get(key);
    if (cached && Date.now() - cached.syncedAt < SYNC_WINDOW_CACHE_TTL_MS) {
      return;
    }
  }

  if (get(syncInProgress)) return;
  syncInProgress.set(true);
  syncError.set('');
  try {
    const result = await runSync(applySyncChunk, { from, to });
    syncWindowCache.set(key, { syncedAt: Date.now(), cursor: result.cursor });
  } catch (err) {
    if (err instanceof BackendApiError && err.code === 'RATE_LIMITED') {
      syncError.set(formatRateLimitMessage(err.retryAfter));
    } else if (err instanceof Error) {
      syncError.set(err.message);
    } else {
      syncError.set('Failed to sync events.');
    }
  } finally {
    syncInProgress.set(false);
  }
}

export async function ensureAdminSession(): Promise<boolean> {
  const token = getPasscode();
  if (!token) {
    isAdmin.set(false);
    return false;
  }

  try {
    await getAdminMe();
    isAdmin.set(true);
    return true;
  } catch {
    isAdmin.set(false);
    clearPasscode();
    return false;
  }
}

export async function logoutAdminSession(): Promise<void> {
  try {
    await logoutAdmin();
  } catch {
    // Best-effort logout; always clear local session.
  }
  clearPasscode();
  isAdmin.set(false);
}

// ── App state ──
export const language = writable<Language>('en');
export const languageLocked = writable<boolean>(false);
export const selectedDay = writable<DayData | null>(null);

const today = new Date();
export const currentYear = writable(today.getFullYear());
export const currentMonth = writable(today.getMonth());

/**
 * Load a year's liturgical data (both languages).
 */
export async function ensureYear(year: number): Promise<boolean> {
  const key = String(year);

  if (get(unavailableYears).has(year)) return false;

  const enCache = get(cacheEN);
  const krCache = get(cacheKR);
  if (enCache[year] && krCache[year]) return true;

  if (loadingYears.has(key)) {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (!loadingYears.has(key)) {
          clearInterval(check);
          resolve(!get(unavailableYears).has(year));
        }
      }, 50);
    });
  }

  loadingYears.add(key);

  try {
    const [en, kr] = await Promise.all([
      fetchYear(year, 'en'),
      fetchYear(year, 'kr'),
    ]);

    if (en && en.length > 0) {
      cacheEN.update(c => ({ ...c, [year]: en }));
      cacheKR.update(c => ({ ...c, [year]: kr ?? en }));
      return true;
    } else {
      unavailableYears.update(s => { s.add(year); return new Set(s); });
      return false;
    }
  } catch {
    unavailableYears.update(s => { s.add(year); return new Set(s); });
    return false;
  } finally {
    loadingYears.delete(key);
  }
}

/**
 * Load parish events for a year.
 */
export async function loadEvents(year: number) {
  if (loadingEventYears.has(year)) return;

  if (!hydratedYears.has(year)) {
    loadingEventYears.add(year);
    const from = `${String(year).padStart(4, '0')}-01-01`;
    const to = `${String(year).padStart(4, '0')}-12-31`;
    try {
      const events = await fetchEventsRange(from, to);

      allEventsById.update((current) => {
        const next = { ...current };
        for (const evt of events) {
          next[evt.id] = evt;
        }
        return next;
      });
      hydratedYears.add(year);
      rebuildEventsCache();
      return;
    } finally {
      loadingEventYears.delete(year);
    }
  }

  const cache = get(eventsCache);
  if (!cache[year]) {
    const all = Object.values(get(allEventsById));
    const grouped = groupByYear(all);
    eventsCache.update((current) => ({
      ...current,
      [year]: grouped[year] || [],
    }));
  }
}

/**
 * Refresh events for the current year after a mutation.
 */
export async function refreshEvents() {
  await syncEventsForYear(get(currentYear), { force: true });
  hydratedYears.delete(get(currentYear));
  await loadEvents(get(currentYear));
}
