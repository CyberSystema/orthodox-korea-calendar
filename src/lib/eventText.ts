import type { Language, ParishEvent } from './types';

function normalize(value: string | undefined | null): string {
  return (value || '').trim();
}

export function eventTitleForLang(event: ParishEvent, lang: Language): string {
  const en = normalize(event.titleEn);
  const ko = normalize(event.titleKo);
  const legacy = normalize(event.title);

  if (lang === 'kr') return ko || en || legacy;
  return en || ko || legacy;
}

export function eventDescriptionForLang(event: ParishEvent, lang: Language): string {
  const en = normalize(event.descriptionEn);
  const ko = normalize(event.descriptionKo);
  const legacy = normalize(event.description);

  if (lang === 'kr') return ko || en || legacy;
  return en || ko || legacy;
}
