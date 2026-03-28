import type { ParishEvent, Recurrence, NotificationTarget } from './types';

const API = '/api/events';

export interface NotificationResult {
  attempted: boolean;
  sent: boolean; // reflects only the immediate notification
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

export interface CreateEventResult {
  event: ParishEvent;
  notification?: NotificationResult;
}

export async function fetchEvents(year: number): Promise<ParishEvent[]> {
  try {
    const res = await fetch(`${API}?year=${year}`);
    if (!res.ok) return [];
    return (await res.json()) as ParishEvent[];
  } catch {
    return [];
  }
}

export async function createEvent(
  data: {
    date: string;
    titleEn?: string;
    titleKo?: string;
    descriptionEn?: string;
    descriptionKo?: string;
    notify?: boolean;
    notificationTarget?: NotificationTarget;
    recurrence?: Recurrence;
  },
  passcode: string,
): Promise<CreateEventResult | null> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, passcode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to create event');
  }
  const payload = await res.json();

  // Backward compatibility with older server shape that returned event directly.
  if (payload && typeof payload === 'object' && 'event' in payload) {
    return payload as CreateEventResult;
  }

  return { event: payload as ParishEvent };
}

export async function updateEvent(
  data: {
    id: string;
    date: string;
    titleEn?: string;
    titleKo?: string;
    descriptionEn?: string;
    descriptionKo?: string;
    recurrence?: Recurrence;
    originalYear?: number;
  },
  passcode: string,
): Promise<ParishEvent | null> {
  const res = await fetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, passcode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to update event');
  }
  return (await res.json()) as ParishEvent;
}

export async function deleteEvent(id: string, year: number, passcode: string): Promise<boolean> {
  const res = await fetch(API, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, year, passcode }),
  });
  return res.ok;
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
