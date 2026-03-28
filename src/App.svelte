<script lang="ts">
  import { onMount } from 'svelte';
  import MonthGrid from './components/MonthGrid.svelte';
  import DayPanel from './components/DayPanel.svelte';
  import EventPanel from './components/EventPanel.svelte';
  import TodayWidget from './components/TodayWidget.svelte';
  import Modal from './components/Modal.svelte';
  import AdminPanel from './components/AdminPanel.svelte';
  import {
    cacheEN,
    cacheKR,
    eventsCache,
    unavailableYears,
    selectedDay,
    currentMonth,
    currentYear,
    language,
    languageLocked,
    isAdmin,
    clearPasscode,
    ensureYear,
    loadEvents,
  } from './lib/store';
  import { readParams } from './lib/params';
  import { getTranslations } from './lib/i18n';
  import { toLocalISO } from './lib/date';
  import { updateLanguageTag } from './lib/onesignal';
  import type { DayData, ParishEvent } from './lib/types';

  const params = readParams();

  let loading = $state(true);
  let error = $state(false);
  let errorMsg = $state('');
  let showAdmin = $state(false);
  let editingEvent = $state<ParishEvent | null>(null);
  let addEventDate = $state('');
  let selectedEvent = $state<ParishEvent | null>(null);
  let pendingEventId = $state(params.eventId);
  let pendingEventDate = $state(params.eventDate);

  if (params.lang) {
    language.set(params.lang);
    languageLocked.set(true);
  }

  let activeData = $derived.by(() => {
    const cache = $language === 'en' ? $cacheEN : $cacheKR;
    return cache[$currentYear] ?? [];
  });

  let currentEvents = $derived($eventsCache[$currentYear] ?? []);

  let t = $derived(getTranslations($language));

  let selectedDayLocalized = $derived.by(() => {
    const sel = $selectedDay;
    if (!sel) return null;
    return activeData.find((d) => d.date === sel.date) ?? sel;
  });

  let todayData = $derived.by(() => {
    const iso = toLocalISO(new Date());
    return activeData.find((d) => d.date === iso) ?? null;
  });

  let selectedEventFresh = $derived.by(() => {
    if (!selectedEvent) return null;
    return (
      currentEvents.find(
        (evt) => evt.id === selectedEvent!.id && evt.date === selectedEvent!.date,
      ) ??
      currentEvents.find((evt) => evt.id === selectedEvent!.id) ??
      selectedEvent
    );
  });

  let monthLabel = $derived(
    new Date($currentYear, $currentMonth).toLocaleString($language === 'en' ? 'en' : 'ko', {
      month: 'long',
      year: 'numeric',
    }),
  );
  let nextMonthLabel = $derived.by(() => {
    let m = $currentMonth + 1,
      y = $currentYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    return new Date(y, m).toLocaleString($language === 'en' ? 'en' : 'ko', { month: 'long' });
  });
  let prevMonthLabel = $derived.by(() => {
    let m = $currentMonth - 1,
      y = $currentYear;
    if (m < 0) {
      m = 11;
      y--;
    }
    return new Date(y, m).toLocaleString($language === 'en' ? 'en' : 'ko', { month: 'long' });
  });

  let isYearMissing = $derived($unavailableYears.has($currentYear));

  let showGoToday = $derived.by(() => {
    const now = new Date();
    return $currentYear !== now.getFullYear() || $currentMonth !== now.getMonth();
  });

  async function loadYearAndEvents(year: number) {
    await ensureYear(year);
    await loadEvents(year);
  }

  function isValidISODate(value: string | null): value is string {
    return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function syncEventUrl(event: ParishEvent | null) {
    const url = new URL(window.location.href);
    if (event) {
      url.searchParams.set('event', event.id);
      url.searchParams.set('date', event.date);
    } else {
      url.searchParams.delete('event');
      url.searchParams.delete('date');
    }
    window.history.replaceState({}, '', url);
  }

  onMount(async () => {
    try {
      const thisYear = new Date().getFullYear();
      const initialDate = isValidISODate(params.eventDate) ? params.eventDate : null;
      const initialYear = initialDate ? Number.parseInt(initialDate.slice(0, 4), 10) : thisYear;
      const initialMonth = initialDate
        ? Number.parseInt(initialDate.slice(5, 7), 10) - 1
        : new Date().getMonth();

      currentYear.set(initialYear);
      currentMonth.set(initialMonth);

      const ok = await ensureYear(initialYear);
      if (!ok) {
        errorMsg = `No calendar data available for ${initialYear}.`;
        error = true;
      }
      await loadEvents(initialYear);
      // Preload next year silently
      ensureYear(initialYear + 1).catch(() => {});
      loadEvents(initialYear + 1).catch(() => {});
    } catch (e: any) {
      errorMsg = e.message || 'Failed to load.';
      error = true;
    }
    loading = false;
  });

  $effect(() => {
    if (loading || !pendingEventId) return;

    const matched =
      currentEvents.find(
        (evt) => evt.id === pendingEventId && (!pendingEventDate || evt.date === pendingEventDate),
      ) ?? currentEvents.find((evt) => evt.id === pendingEventId);

    if (matched) {
      selectedDay.set(null);
      selectedEvent = matched;
      pendingEventId = null;
      pendingEventDate = null;
      return;
    }

    if (
      isValidISODate(pendingEventDate) &&
      Number.parseInt(pendingEventDate.slice(0, 4), 10) === $currentYear
    ) {
      pendingEventId = null;
      pendingEventDate = null;
    }
  });

  function prevMonth() {
    selectedDay.set(null);
    if ($currentMonth === 0) {
      const newYear = $currentYear - 1;
      currentMonth.set(11);
      currentYear.set(newYear);
      loadYearAndEvents(newYear);
    } else {
      currentMonth.set($currentMonth - 1);
    }
  }

  function nextMonth() {
    selectedDay.set(null);
    if ($currentMonth === 11) {
      const newYear = $currentYear + 1;
      currentMonth.set(0);
      currentYear.set(newYear);
      loadYearAndEvents(newYear);
    } else {
      currentMonth.set($currentMonth + 1);
    }
  }

  function goToToday() {
    const now = new Date();
    currentYear.set(now.getFullYear());
    currentMonth.set(now.getMonth());
    selectedDay.set(null);
    loadYearAndEvents(now.getFullYear());
  }

  function closePanel() {
    selectedDay.set(null);
  }

  function openEventPanel(evt: ParishEvent) {
    selectedDay.set(null);
    selectedEvent = evt;
    syncEventUrl(evt);
  }

  function closeEventPanel() {
    selectedEvent = null;
    syncEventUrl(null);
  }

  function toggleLanguage() {
    if ($languageLocked) return;
    const cur = $language;
    const next = cur === 'en' ? 'kr' : 'en';
    language.set(next);
    updateLanguageTag(next);
    if ($selectedDay) {
      const cache = cur === 'en' ? $cacheKR : $cacheEN;
      const data = cache[$currentYear] ?? [];
      const m = data.find((d) => d.date === $selectedDay!.date);
      if (m) selectedDay.set(m);
    }
  }

  function openAdminPanel() {
    editingEvent = null;
    addEventDate = '';
    showAdmin = true;
  }

  function openAddEvent() {
    editingEvent = null;
    addEventDate = $selectedDay?.date ?? '';
    selectedDay.set(null);
    showAdmin = true;
  }

  function openEditEvent(evt: ParishEvent) {
    editingEvent = evt;
    selectedEvent = null;
    addEventDate = '';
    selectedDay.set(null);
    showAdmin = true;
  }

  function closeAdminPanel() {
    showAdmin = false;
    editingEvent = null;
    addEventDate = '';
  }

  function handleLogout() {
    isAdmin.set(false);
    clearPasscode();
  }
</script>

<!-- ═══ TODAY WIDGET ═══ -->
{#if params.view === 'today'}
  <div class="widget-wrap">
    {#if loading}
      <div class="loader"><span class="cross-pulse">♱</span></div>
    {:else if error}
      <div class="err-msg">{errorMsg}</div>
    {:else}
      <TodayWidget day={todayData} {t} lang={$language} />
    {/if}
  </div>

  <!-- ═══ FULL CALENDAR ═══ -->
{:else}
  <div class="app">
    <header class="hdr">
      <div class="hdr-inner">
        <div class="brand">
          <span class="brand-cross">♱</span>
          <div class="brand-info">
            <span class="brand-name">Orthodox Korea</span>
            <span class="brand-sub">{t.calendar}</span>
          </div>
        </div>
        <div class="hdr-actions">
          {#if $isAdmin}
            <span class="admin-badge">{t.admin}</span>
            <button class="hdr-icon-btn" onclick={handleLogout} title={t.logout}>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg
              >
            </button>
          {:else}
            <button class="hdr-icon-btn" onclick={openAdminPanel} title={t.admin}>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path
                  d="M7 11V7a5 5 0 0110 0v4"
                /></svg
              >
            </button>
          {/if}
          {#if !$languageLocked}
            <button class="lang-btn" onclick={toggleLanguage}>
              <span class="lang-flag">{$language === 'en' ? '🇬🇧' : '🇰🇷'}</span>
              <span class="lang-text">{$language === 'en' ? 'English' : '한국어'}</span>
            </button>
          {/if}
        </div>
      </div>
      <div class="hdr-gold"></div>
    </header>

    <main>
      {#if loading}
        <div class="center-msg">
          <span class="cross-pulse">♱</span>
          <p>{t.loading}</p>
        </div>
      {:else if error}
        <div class="center-msg"><p class="err">⚠ {errorMsg}</p></div>
      {:else}
        <!-- Month Navigation -->
        <nav class="month-nav">
          <button class="mn-btn" onclick={prevMonth}>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"><path d="M15 19l-7-7 7-7" /></svg
            >
            <span class="mn-label">{prevMonthLabel}</span>
          </button>
          <div class="month-title-block">
            <h1 class="month-title">{monthLabel}</h1>
            <div class="month-rule"></div>
          </div>
          <button class="mn-btn" onclick={nextMonth}>
            <span class="mn-label">{nextMonthLabel}</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"><path d="M9 5l7 7-7 7" /></svg
            >
          </button>
        </nav>

        <!-- Year not available -->
        {#if isYearMissing}
          <div class="year-notice">
            <span class="notice-cross">♱</span>
            <p>
              {$language === 'en'
                ? `The ${$currentYear} calendar has not been published yet.`
                : `${$currentYear}년 달력은 아직 발행되지 않았습니다.`}
            </p>
            <button class="notice-btn" onclick={goToToday}>
              {$language === 'en' ? '← Back to current month' : '← 현재 달로 돌아가기'}
            </button>
          </div>
        {:else}
          <MonthGrid data={activeData} {t} events={currentEvents} />

          <!-- Day Detail Modal -->
          <Modal open={$selectedDay !== null} onClose={closePanel}>
            {#if selectedDayLocalized}
              <DayPanel
                day={selectedDayLocalized}
                {t}
                lang={$language}
                events={currentEvents}
                onAddEvent={openAddEvent}
                onEditEvent={openEditEvent}
                onViewEvent={openEventPanel}
              />
            {/if}
          </Modal>

          <Modal open={selectedEventFresh !== null} onClose={closeEventPanel}>
            {#if selectedEventFresh}
              <EventPanel event={selectedEventFresh} {t} lang={$language} />
            {/if}
          </Modal>

          <!-- Admin Modal -->
          <Modal open={showAdmin} onClose={closeAdminPanel}>
            <AdminPanel
              {t}
              year={$currentYear}
              onClose={closeAdminPanel}
              {editingEvent}
              prefillDate={addEventDate}
            />
          </Modal>
        {/if}

        <!-- Go to Today -->
        {#if showGoToday && !isYearMissing}
          <button class="go-today" onclick={goToToday}>{t.today} ↩</button>
        {/if}

        <!-- Legend -->
        {#if !isYearMissing}
          <section class="legend">
            <div class="ornament">{t.legend}</div>
            <div class="legend-grid">
              {#each [['/fast.jpeg', t.fast], ['/cheese.jpeg', t.cheese], ['/fish.jpeg', t.fish], ['/pres.jpeg', t.pres], ['/bas_lit.jpeg', t.basil], ['/div_lit.jpeg', t.dl]] as [src, label]}
                <div class="legend-item">
                  <img {src} alt={label} />
                  <span>{label}</span>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <footer class="foot">
          <span class="foot-cross">♱</span>
          <span>Orthodox Metropolis of Korea</span>
        </footer>
      {/if}
    </main>
  </div>
{/if}

<style>
  /* ═══ WIDGET ═══ */
  .widget-wrap {
    min-height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .loader {
    text-align: center;
    padding: 3rem;
  }
  .err-msg {
    text-align: center;
    padding: 2rem;
    color: var(--crimson);
    font-weight: 600;
  }
  .cross-pulse {
    display: inline-block;
    font-size: 2.4rem;
    color: var(--gold);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.06);
    }
  }

  /* ═══ APP ═══ */
  .app {
    min-height: 100%;
  }

  /* ── Header ── */
  .hdr {
    background: var(--wine-deep);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .hdr-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0.65rem 1.2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .hdr-gold {
    height: 2.5px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--gold),
      var(--gold-bright),
      var(--gold),
      transparent
    );
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .brand-cross {
    font-size: 1.7rem;
    color: var(--gold-bright);
  }
  .brand-info {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }
  .brand-name {
    font-family: var(--serif);
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--gold-pale);
    letter-spacing: 0.02em;
  }
  .brand-sub {
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--ink-faint);
    margin-top: 1px;
  }

  .hdr-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .hdr-icon-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid rgba(197, 153, 62, 0.3);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    color: var(--gold-bright);
    cursor: pointer;
    transition: all 0.2s;
  }
  .hdr-icon-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: var(--gold);
  }

  .admin-badge {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--gold-pale);
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--gold-dim);
    border-radius: 99px;
    background: rgba(184, 148, 46, 0.1);
  }

  .lang-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1.5px solid var(--gold-dim);
    color: var(--gold-bright);
    border-radius: 99px;
    cursor: pointer;
    font-family: var(--sans);
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .lang-btn:hover {
    background: var(--gold-bright);
    color: var(--wine-deep);
    border-color: var(--gold-bright);
  }
  .lang-flag {
    font-size: 1.05rem;
  }

  /* ── Main ── */
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.2rem 1rem 2rem;
  }
  .center-msg {
    text-align: center;
    padding: 5rem 1rem;
  }
  .center-msg p {
    color: var(--ink-muted);
    margin-top: 0.6rem;
  }
  .center-msg p.err {
    color: var(--crimson);
    font-weight: 600;
  }

  /* ── Month Nav ── */
  .month-nav {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    margin-bottom: 1.4rem;
    gap: 0.5rem;
  }
  .month-title-block {
    grid-column: 2;
    text-align: center;
  }
  .month-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--wine);
    margin: 0;
    white-space: nowrap;
  }
  .month-rule {
    width: 40px;
    height: 2px;
    background: var(--gold);
    margin: 0.3rem auto 0;
    border-radius: 99px;
  }
  .mn-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.85rem;
    background: var(--surface-white);
    border: 1.5px solid var(--line);
    color: var(--ink-soft);
    border-radius: 99px;
    cursor: pointer;
    font-family: var(--sans);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
    box-shadow: var(--shadow-warm);
  }
  .mn-btn:hover {
    border-color: var(--gold);
    color: var(--wine);
  }
  .mn-btn:first-child {
    justify-self: start;
  }
  .mn-btn:last-child {
    justify-self: end;
  }
  .mn-btn svg {
    flex-shrink: 0;
  }

  /* ── Year notice ── */
  .year-notice {
    text-align: center;
    padding: 3rem 1.5rem;
    background: var(--surface-white);
    border: 1px solid var(--line-light);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-warm);
  }
  .notice-cross {
    font-size: 2rem;
    color: var(--gold);
    opacity: 0.5;
    display: block;
    margin-bottom: 0.5rem;
  }
  .year-notice p {
    color: var(--ink-muted);
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 420px;
    margin: 0 auto 1rem;
  }
  .notice-btn {
    padding: 0.5rem 1.2rem;
    background: var(--wine);
    color: var(--gold-pale);
    border: none;
    border-radius: 99px;
    font-family: var(--sans);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .notice-btn:hover {
    background: var(--wine-soft);
  }

  /* ── Go to Today ── */
  .go-today {
    position: fixed;
    bottom: 1.2rem;
    right: 1.2rem;
    padding: 0.5rem 1rem;
    background: var(--wine);
    color: var(--gold-pale);
    border: none;
    border-radius: 99px;
    font-family: var(--sans);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-lifted);
    transition: all 0.2s;
    z-index: 50;
    animation: fadeUp 0.3s ease;
  }
  .go-today:hover {
    background: var(--wine-soft);
    transform: translateY(-2px);
  }
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* ── Legend ── */
  .legend {
    margin-top: 2.5rem;
    padding: 1.2rem 1.4rem;
    background: var(--surface-white);
    border: 1px solid var(--line-light);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-warm);
  }
  .legend-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
    gap: 0.5rem;
    margin-top: 0.8rem;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .legend-item img {
    height: 24px;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
  .legend-item span {
    font-size: 0.8rem;
    color: var(--ink-soft);
    font-weight: 500;
  }

  .foot {
    text-align: center;
    padding: 1.5rem 0 0.5rem;
    font-size: 0.75rem;
    color: var(--ink-faint);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  .foot-cross {
    color: var(--gold);
    opacity: 0.35;
  }

  /* ── Responsive ── */
  @media (max-width: 680px) {
    .month-title {
      font-size: 1.3rem;
    }
    .month-rule {
      width: 28px;
    }
    .mn-btn {
      font-size: 0.78rem;
      padding: 0.35rem 0.6rem;
    }
    .mn-label {
      display: none;
    }
    .brand-name {
      font-size: 1.1rem;
    }
    .brand-sub {
      display: none;
    }
    .legend-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .lang-text {
      display: none;
    }
  }
  @media (max-width: 420px) {
    main {
      padding: 0.8rem 0.5rem 2rem;
    }
    .hdr-inner {
      padding: 0.55rem 0.7rem;
    }
  }
</style>
