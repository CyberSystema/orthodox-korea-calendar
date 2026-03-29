export interface CelebrationFields {
  title: string;
  high_rank: boolean;
  celeb: boolean;
  readings?: string[];
  day: number;
  month: number;
  tone?: string;
  m_gosp?: string;
}

export interface CelebrationEntry {
  id: string;
  fields: CelebrationFields;
}

export interface DayData {
  date: string;
  fast: boolean;
  cheese: boolean;
  fish: boolean;
  pres: boolean;
  saint_basil: boolean;
  dl: boolean;
  readings: string[];
  content: CelebrationEntry[];
}

export type Language = 'en' | 'kr';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type NotificationTarget = 'all' | 'english' | 'korean';

// ── Custom Parish Events ──

export interface ParishEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type?: string;
  color?: string;
  allDay?: boolean;
  parentEventId?: string;
  isOccurrence?: boolean;
  seriesStartDate?: string;
  titleEn?: string;
  titleKo?: string;
  descriptionEn?: string;
  descriptionKo?: string;
  title: string;
  description: string;
  notify: boolean; // was notification sent?
  notificationTarget?: NotificationTarget; // which subscriber group(s) to notify
  recurrence: Recurrence;
  recurrenceInterval?: number;
  recurrenceUntil?: string;
  createdAt: string; // ISO datetime
}
