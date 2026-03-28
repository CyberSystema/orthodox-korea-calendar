import type { DayData } from './types';

const REMOTE_BASE =
  'https://raw.githubusercontent.com/CyberSystema/orthodox-korea-calendar/refs/heads/main/public/data/';

/**
 * Fetch calendar data for a specific year and language.
 * Tries remote (GitHub) first, falls back to local /data/ folder.
 * Returns null if the year's data doesn't exist yet.
 */
export async function fetchYear(year: number, lang: 'en' | 'kr'): Promise<DayData[] | null> {
  const filename = `${year}_${lang}.json`;

  // Try remote first
  try {
    const res = await fetch(REMOTE_BASE + filename);
    if (res.ok) return (await res.json()) as DayData[];
  } catch { /* fall through */ }

  // Try local
  try {
    const res = await fetch('/data/' + filename);
    if (res.ok) return (await res.json()) as DayData[];
  } catch { /* fall through */ }

  return null;
}
