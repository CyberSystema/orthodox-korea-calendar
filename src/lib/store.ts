import { writable, get } from 'svelte/store';
import type { DayData, Language, ParishEvent } from './types';
import { fetchYear } from './api';
import { fetchEvents as fetchEventsApi } from './events';

// ── Per-year calendar data cache ──
export const cacheEN = writable<Record<number, DayData[]>>({});
export const cacheKR = writable<Record<number, DayData[]>>({});
export const unavailableYears = writable<Set<number>>(new Set());
const loadingYears = new Set<string>();

// ── Parish events cache ──
export const eventsCache = writable<Record<number, ParishEvent[]>>({});

// ── Admin state ──
export const isAdmin = writable(false);
// Passcode is kept in sessionStorage only, read on demand
export function getPasscode(): string {
  return sessionStorage.getItem('okc_admin') || '';
}
export function setPasscode(code: string) {
  sessionStorage.setItem('okc_admin', code);
}
export function clearPasscode() {
  sessionStorage.removeItem('okc_admin');
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
  const events = await fetchEventsApi(year);
  eventsCache.update(c => ({ ...c, [year]: events }));
}

/**
 * Refresh events for the current year after a mutation.
 */
export async function refreshEvents() {
  await loadEvents(get(currentYear));
}
