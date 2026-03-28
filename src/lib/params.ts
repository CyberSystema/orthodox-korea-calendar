import type { Language } from './types';

export interface AppParams {
  view: 'calendar' | 'today';
  lang: Language | null;
  eventId: string | null;
  eventDate: string | null;
}

export function readParams(): AppParams {
  const url = new URL(window.location.href);
  const view = url.searchParams.get('view') === 'today' ? 'today' : 'calendar';
  const langParam = url.searchParams.get('lang');
  const lang: Language | null =
    langParam === 'en' ? 'en' : langParam === 'ko' ? 'kr' : langParam === 'kr' ? 'kr' : null;
  const eventId = url.searchParams.get('event');
  const eventDate = url.searchParams.get('date');

  return { view, lang, eventId, eventDate };
}
