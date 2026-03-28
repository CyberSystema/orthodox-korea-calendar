<script lang="ts">
  import type { DayData, Language, ParishEvent } from '../lib/types';
  import type { Translations } from '../lib/i18n';
  import { isAdmin, getPasscode, refreshEvents } from '../lib/store';
  import { deleteEvent } from '../lib/events';
  import { eventDescriptionForLang, eventTitleForLang } from '../lib/eventText';

  let {
    day,
    t,
    lang,
    events = [],
    onAddEvent,
    onEditEvent,
    onViewEvent,
  } = $props<{
    day: DayData;
    t: Translations;
    lang: Language;
    events?: ParishEvent[];
    onAddEvent?: () => void;
    onEditEvent?: (event: ParishEvent) => void;
    onViewEvent?: (event: ParishEvent) => void;
  }>();

  let locale = $derived(lang === 'en' ? 'en' : 'ko');
  let dateObj = $derived(new Date(day.date + 'T00:00:00'));
  let dayOfWeek = $derived(dateObj.toLocaleDateString(locale, { weekday: 'long' }));
  let dayNum = $derived(dateObj.getDate());
  let monthYear = $derived(dateObj.toLocaleDateString(locale, { month: 'long', year: 'numeric' }));

  let dayEvents = $derived(events.filter((e: ParishEvent) => e.date === day.date));

  let deleting = $state('');

  async function handleDelete(evt: ParishEvent) {
    if (!confirm(t.deleteConfirm)) return;
    deleting = evt.id;
    const year = parseInt(evt.date.substring(0, 4));
    await deleteEvent(evt.id, year, getPasscode());
    await refreshEvents();
    deleting = '';
  }
</script>

<div class="panel">
  <!-- Date header -->
  <div class="panel-head">
    <div class="date-ring"><span>{dayNum}</span></div>
    <div class="date-text">
      <span class="wday">{dayOfWeek}</span>
      <span class="monyear">{monthYear}</span>
    </div>
  </div>

  <!-- Flags -->
  {#if day.fast || day.cheese || day.fish || day.pres || day.saint_basil || day.dl}
    <div class="flags">
      {#if day.fast}<div class="flag">
          <img src="/fast.jpeg" alt="" /><span>{t.fast}</span>
        </div>{/if}
      {#if day.cheese}<div class="flag">
          <img src="/cheese.jpeg" alt="" /><span>{t.cheese}</span>
        </div>{/if}
      {#if day.fish}<div class="flag">
          <img src="/fish.jpeg" alt="" /><span>{t.fish}</span>
        </div>{/if}
      {#if day.pres}<div class="flag">
          <img src="/pres.jpeg" alt="" /><span>{t.pres}</span>
        </div>{/if}
      {#if day.saint_basil}<div class="flag">
          <img src="/bas_lit.jpeg" alt="" /><span>{t.basil}</span>
        </div>{/if}
      {#if day.dl}<div class="flag"><img src="/div_lit.jpeg" alt="" /><span>{t.dl}</span></div>{/if}
    </div>
  {/if}

  <!-- Readings -->
  <section class="sec">
    <div class="ornament">{t.readings}</div>
    {#if day.readings.length}
      <div class="readings">
        {#each day.readings as reading}
          <span class="rtag">{reading}</span>
        {/each}
      </div>
    {:else}
      <p class="empty-note">{t.noReadings}</p>
    {/if}
  </section>

  <!-- Celebrations -->
  <section class="sec">
    <div class="ornament">{t.celebrations}</div>
    <ul class="clist">
      {#each day.content as entry}
        <li class="citem" class:hi={entry.fields.high_rank} class:feast={entry.fields.celeb}>
          <span class="cname">{entry.fields.title}</span>
          {#if entry.fields.readings?.length}
            <span class="cmeta">📖 {entry.fields.readings}</span>
          {/if}
          {#if entry.fields.tone}
            <span class="cmeta">🎵 {t.tone} {entry.fields.tone}</span>
          {/if}
          {#if entry.fields.m_gosp}
            <span class="cmeta">📜 {t.matins} {entry.fields.m_gosp}</span>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <!-- ═══ PARISH EVENTS ═══ -->
  <section class="sec events-section">
    <div class="ornament">{t.parishEvents}</div>

    {#if dayEvents.length}
      <ul class="elist">
        {#each dayEvents as evt}
          <li class="eitem">
            <button
              class="eitem-content eitem-open"
              type="button"
              onclick={() => onViewEvent?.(evt)}
            >
              <span class="ename">{eventTitleForLang(evt, lang)}</span>
              {#if eventDescriptionForLang(evt, lang)}
                <span class="edesc">{eventDescriptionForLang(evt, lang)}</span>
              {/if}
            </button>
            {#if $isAdmin}
              <div class="eitem-actions">
                <button class="eact" onclick={() => onEditEvent?.(evt)}>✎</button>
                <button
                  class="eact eact-del"
                  onclick={() => handleDelete(evt)}
                  disabled={deleting === evt.id}>✕</button
                >
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty-note">{t.noEvents}</p>
    {/if}

    {#if $isAdmin}
      <button class="add-event-btn" onclick={() => onAddEvent?.()}>
        + {t.addEvent}
      </button>
    {/if}
  </section>
</div>

<style>
  .panel {
    padding: 0.2rem 0;
  }

  /* ── Header ── */
  .panel-head {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding-bottom: 1rem;
    margin-bottom: 0.9rem;
    border-bottom: 1px solid var(--line-light);
  }
  .date-ring {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    border: 2.5px solid var(--crimson);
    color: var(--crimson);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: var(--serif);
    font-size: 1.7rem;
    font-weight: 700;
    line-height: 1;
  }
  .date-text {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }
  .wday {
    font-family: var(--serif);
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--wine);
  }
  .monyear {
    font-size: 0.85rem;
    color: var(--ink-muted);
    font-weight: 500;
  }

  /* ── Flags ── */
  .flags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    padding: 0.65rem 0.8rem;
    background: var(--parchment);
    border: 1px solid var(--line-light);
    border-radius: var(--r-md);
    margin-bottom: 1rem;
  }
  .flag {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.45rem 0.15rem 0.15rem;
    background: var(--surface-white);
    border: 1px solid var(--line);
    border-radius: 99px;
  }
  .flag img {
    height: 22px;
    border-radius: 50%;
  }
  .flag span {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--ink-soft);
  }

  /* ── Sections ── */
  .sec {
    margin-bottom: 1rem;
  }
  .readings {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.5rem;
  }
  .rtag {
    padding: 0.2rem 0.6rem;
    background: var(--gold-glow);
    border: 1px solid var(--gold);
    border-radius: 99px;
    font-family: var(--serif);
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--ink-body);
  }
  .empty-note {
    color: var(--ink-muted);
    font-style: italic;
    margin: 0.5rem 0 0;
  }

  /* ── Celebrations ── */
  .clist {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .citem {
    padding: 0.5rem 0.7rem;
    border-left: 3px solid var(--line);
    border-radius: 0 var(--r-sm) var(--r-sm) 0;
    background: var(--surface-white);
  }
  .citem.hi {
    border-left-color: var(--crimson);
    background: rgba(140, 27, 27, 0.04);
  }
  .citem.feast {
    border-left-color: var(--gold);
    background: var(--gold-glow);
  }
  .cname {
    display: block;
    font-weight: 600;
    font-size: 0.92rem;
    line-height: 1.35;
    white-space: pre-line;
  }
  .citem.hi .cname {
    color: var(--crimson);
  }
  .citem.feast .cname {
    color: var(--ink-soft);
    font-style: italic;
  }
  .cmeta {
    display: block;
    font-size: 0.78rem;
    color: var(--ink-muted);
    font-style: italic;
    margin-top: 0.12rem;
  }

  /* ═══ PARISH EVENTS ═══ */
  .events-section {
    margin-top: 0.5rem;
  }

  .elist {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .eitem {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    border-left: 3px solid #3060b8;
    border-radius: 0 var(--r-sm) var(--r-sm) 0;
    background: rgba(48, 96, 184, 0.04);
  }
  .eitem-content {
    flex: 1;
    min-width: 0;
  }
  .eitem-open {
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .ename {
    display: block;
    font-weight: 600;
    font-size: 0.92rem;
    color: #2a4f8c;
    line-height: 1.35;
  }
  .eitem-open:hover .ename {
    text-decoration: underline;
    text-decoration-color: var(--gold);
    text-underline-offset: 0.18em;
  }
  .edesc {
    display: block;
    font-size: 0.8rem;
    color: var(--ink-muted);
    margin-top: 0.15rem;
    white-space: pre-line;
  }

  .eitem-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
    padding-top: 0.1rem;
  }
  .eact {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--surface-white);
    color: var(--ink-muted);
    cursor: pointer;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .eact:hover {
    border-color: var(--ink-faint);
    color: var(--ink-soft);
  }
  .eact-del:hover {
    border-color: var(--crimson);
    color: var(--crimson);
    background: rgba(140, 27, 27, 0.05);
  }
  .eact:disabled {
    opacity: 0.4;
  }

  .add-event-btn {
    display: block;
    width: 100%;
    margin-top: 0.6rem;
    padding: 0.5rem;
    border: 1.5px dashed var(--line);
    border-radius: var(--r-md);
    background: transparent;
    color: var(--ink-muted);
    font-family: var(--sans);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .add-event-btn:hover {
    border-color: #3060b8;
    color: #3060b8;
    background: rgba(48, 96, 184, 0.04);
  }
</style>
