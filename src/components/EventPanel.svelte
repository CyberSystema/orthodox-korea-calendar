<script lang="ts">
  import type { Translations } from '../lib/i18n';
  import type { Language, ParishEvent } from '../lib/types';
  import { eventDescriptionForLang, eventTitleForLang } from '../lib/eventText';

  let { event, t, lang } = $props<{
    event: ParishEvent;
    t: Translations;
    lang: Language;
  }>();

  let formattedDate = $derived(
    new Date(event.date + 'T00:00:00').toLocaleDateString(lang === 'en' ? 'en' : 'ko', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  );

  let recurrenceLabel = $derived.by(() => {
    switch (event.recurrence) {
      case 'daily':
        return t.recurrenceDaily;
      case 'weekly':
        return t.recurrenceWeekly;
      case 'monthly':
        return t.recurrenceMonthly;
      case 'yearly':
        return t.recurrenceYearly;
      default:
        return t.recurrenceNone;
    }
  });

  let eventTypeLabel = $derived.by(() => {
    switch (event.type) {
      case 'feast':
        return t.eventTypeFeast;
      case 'fast':
        return t.eventTypeFast;
      case 'commemoration':
        return t.eventTypeCommemoration;
      default:
        return t.eventTypeOther;
    }
  });

  let recurrenceDetail = $derived.by(() => {
    if (event.recurrence === 'none') return recurrenceLabel;
    const interval =
      event.recurrenceInterval && event.recurrenceInterval > 1
        ? ` x${event.recurrenceInterval}`
        : '';
    const until = event.recurrenceUntil ? ` · ${event.recurrenceUntil}` : '';
    return `${recurrenceLabel}${interval}${until}`;
  });

  let localizedTitle = $derived(eventTitleForLang(event, lang));
  let localizedDescription = $derived(eventDescriptionForLang(event, lang));

  function addDays(date: string, days: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const dt = new Date(Date.UTC(year, month - 1, day));
    dt.setUTCDate(dt.getUTCDate() + days);
    const nextYear = String(dt.getUTCFullYear()).padStart(4, '0');
    const nextMonth = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const nextDay = String(dt.getUTCDate()).padStart(2, '0');
    return `${nextYear}${nextMonth}${nextDay}`;
  }

  function calendarDate(date: string): string {
    return date.replaceAll('-', '');
  }

  function recurrenceRule(): string {
    if (event.recurrence === 'none') return '';
    const freq = event.recurrence.toUpperCase();
    const parts = [`FREQ=${freq}`];
    if (event.recurrenceInterval && event.recurrenceInterval > 1) {
      parts.push(`INTERVAL=${event.recurrenceInterval}`);
    }
    if (event.recurrenceUntil) {
      parts.push(`UNTIL=${event.recurrenceUntil.replaceAll('-', '')}T235959Z`);
    }
    return `RRULE:${parts.join(';')}`;
  }

  let googleCalendarUrl = $derived.by(() => {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', localizedTitle);
    url.searchParams.set('details', localizedDescription);
    url.searchParams.set('dates', `${calendarDate(event.date)}/${addDays(event.date, 1)}`);
    if (event.recurrence !== 'none') {
      url.searchParams.set('recur', recurrenceRule());
    }
    return url.toString();
  });

  let outlookCalendarUrl = $derived.by(() => {
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.set('path', '/calendar/action/compose');
    url.searchParams.set('rru', 'addevent');
    url.searchParams.set('subject', localizedTitle);
    url.searchParams.set('body', localizedDescription);
    url.searchParams.set('startdt', `${event.date}T00:00:00Z`);
    url.searchParams.set('enddt', `${event.date}T23:59:00Z`);
    if (event.recurrence !== 'none') {
      url.searchParams.set('recurrence', recurrenceRule().replace('RRULE:', ''));
    }
    return url.toString();
  });

  function escapeIcs(value: string): string {
    return value
      .replaceAll('\\', '\\\\')
      .replaceAll(';', '\\;')
      .replaceAll(',', '\\,')
      .replaceAll('\n', '\\n');
  }

  function downloadAppleCalendar() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Orthodox Korea//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@orthodox-korea-calendar`,
      `DTSTAMP:${new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z')}`,
      `DTSTART;VALUE=DATE:${calendarDate(event.date)}`,
      `DTEND;VALUE=DATE:${addDays(event.date, 1)}`,
      `SUMMARY:${escapeIcs(localizedTitle)}`,
      `DESCRIPTION:${escapeIcs(localizedDescription)}`,
    ];

    const rule = recurrenceRule();
    if (rule) lines.push(rule);

    lines.push('END:VEVENT', 'END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${localizedTitle.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'event'}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="event-panel">
  <div class="event-head">
    <div>
      <div class="ornament">{t.eventDetails}</div>
      <h3 class="event-title">{localizedTitle}</h3>
    </div>
    <div class="event-badge">{recurrenceLabel}</div>
  </div>

  <div class="event-meta-grid">
    <div class="event-meta-card">
      <span class="event-meta-label">{t.eventDate}</span>
      <span class="event-meta-value">{formattedDate}</span>
    </div>
    <div class="event-meta-card">
      <span class="event-meta-label">{t.recurrence}</span>
      <span class="event-meta-value">{recurrenceDetail}</span>
    </div>
    <div class="event-meta-card">
      <span class="event-meta-label">{t.eventType}</span>
      <span class="event-meta-value">{eventTypeLabel}</span>
    </div>
    <div class="event-meta-card">
      <span class="event-meta-label">{t.allDay}</span>
      <span class="event-meta-value"
        >{event.allDay ? (lang === 'en' ? 'Yes' : '예') : lang === 'en' ? 'No' : '아니오'}</span
      >
    </div>
    {#if event.isOccurrence}
      <div class="event-meta-card">
        <span class="event-meta-label">{t.occurrence}</span>
        <span class="event-meta-value">{event.parentEventId || event.id}</span>
      </div>
    {/if}
  </div>

  <section class="event-body">
    <div class="ornament">{t.eventDescription}</div>
    <p class:event-body-empty={!localizedDescription}>
      {localizedDescription || t.noDescription}
    </p>
  </section>

  <section class="event-actions-wrap">
    <div class="ornament">{t.addToCalendar}</div>
    <div class="event-actions">
      <a
        class="event-action event-action-link"
        href={googleCalendarUrl}
        target="_blank"
        rel="noreferrer"
      >
        {t.googleCalendar}
      </a>
      <button class="event-action" type="button" onclick={downloadAppleCalendar}>
        {t.appleCalendar}
      </button>
      <a
        class="event-action event-action-link"
        href={outlookCalendarUrl}
        target="_blank"
        rel="noreferrer"
      >
        {t.outlookCalendar}
      </a>
    </div>
  </section>
</div>

<style>
  .event-panel {
    display: grid;
    gap: 1rem;
    padding-bottom: 0.35rem;
  }

  .event-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding-right: 2rem;
  }

  .event-title {
    margin: 0.5rem 0 0;
    font-size: 1.5rem;
    color: var(--wine);
  }

  .event-badge {
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: var(--gold-glow);
    border: 1px solid var(--gold-dim);
    color: var(--wine);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .event-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .event-meta-card {
    padding: 0.85rem 0.95rem;
    border-radius: var(--r-md);
    background: var(--surface-white);
    border: 1px solid var(--line-light);
    display: grid;
    gap: 0.2rem;
  }

  .event-meta-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-muted);
    font-weight: 700;
  }

  .event-meta-value {
    color: var(--ink-body);
    font-weight: 600;
  }

  .event-body p {
    margin: 0.75rem 0 0;
    line-height: 1.6;
    color: var(--ink-body);
  }

  .event-body-empty {
    color: var(--ink-muted);
    font-style: italic;
  }

  .event-actions-wrap {
    display: grid;
    gap: 0.75rem;
  }

  .event-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .event-action {
    appearance: none;
    border: 1px solid var(--line);
    background: var(--surface-white);
    color: var(--wine);
    border-radius: 999px;
    padding: 0.7rem 1rem;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .event-action:hover {
    transform: translateY(-1px);
    border-color: var(--gold);
    background: var(--parchment-light);
  }

  .event-action-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 640px) {
    .event-head {
      flex-direction: column;
      padding-right: 0;
    }

    .event-meta-grid {
      grid-template-columns: 1fr;
    }

    .event-actions {
      flex-direction: column;
    }

    .event-action {
      width: 100%;
      justify-content: center;
      text-align: center;
    }
  }
</style>
