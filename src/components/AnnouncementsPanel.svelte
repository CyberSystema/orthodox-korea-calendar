<script lang="ts">
  import { onMount } from 'svelte';
  import type { Translations } from '../lib/i18n';
  import type { Language } from '../lib/types';
  import { apiClient } from '../lib/apiClient';
  import type { ApiAnnouncement, ApiEvent } from '../lib/sdk';

  let { t, lang, onViewEvent, isAdmin } = $props<{
    t: Translations;
    lang: Language;
    onViewEvent: (eventId: string) => void;
    isAdmin: boolean;
  }>();

  let loading = $state(true);
  let error = $state(false);
  let items = $state<ApiAnnouncement[]>([]);

  // Detail view state.
  let selected = $state<ApiAnnouncement | null>(null);
  let linkedEvent = $state<ApiEvent | null>(null);
  let linkedLoading = $state(false);

  async function load() {
    loading = true;
    error = false;
    try {
      const res = await apiClient.listAnnouncements({ limit: 30 });
      items = res.announcements ?? [];
    } catch {
      error = true;
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function pickText(text: { en: string; ko: string }): string {
    const primary = lang === 'kr' ? text.ko : text.en;
    const fallback = lang === 'kr' ? text.en : text.ko;
    return (primary && primary.trim()) || (fallback && fallback.trim()) || '';
  }

  function audienceLabel(target: ApiAnnouncement['target']): string {
    if (target === 'en') return t.announcementsAudienceEn;
    if (target === 'ko') return t.announcementsAudienceKo;
    return t.announcementsNotice;
  }

  function relativeTime(sentAt: number): string {
    const now = Date.now();
    const diffMs = now - sentAt * 1000;
    const isKo = lang === 'kr';
    if (diffMs < 0) return isKo ? '방금' : 'just now';
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (sec < 45) return isKo ? '방금' : 'just now';
    if (min < 60) {
      const n = Math.max(1, min);
      return isKo ? `${n}분 전` : `${n} minute${n === 1 ? '' : 's'} ago`;
    }
    if (hr < 24) return isKo ? `${hr}시간 전` : `${hr} hour${hr === 1 ? '' : 's'} ago`;
    if (day < 7) return isKo ? `${day}일 전` : `${day} day${day === 1 ? '' : 's'} ago`;
    return new Date(sentAt * 1000).toLocaleDateString(isKo ? 'ko' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatEventDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'kr' ? 'ko' : 'en', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async function openDetail(item: ApiAnnouncement) {
    selected = item;
    linkedEvent = null;
    if (item.eventId) {
      linkedLoading = true;
      try {
        // The backend resolves an occurrence id (parent::date) to the parent event.
        linkedEvent = await apiClient.getEvent(item.eventId);
      } catch {
        linkedEvent = null;
      } finally {
        linkedLoading = false;
      }
    }
  }

  function closeDetail() {
    selected = null;
    linkedEvent = null;
  }

  async function doDelete(item: ApiAnnouncement) {
    if (!confirm(t.announcementsDeleteConfirm)) return;
    const previous = items;
    items = items.filter((a) => a.id !== item.id);
    if (selected && selected.id === item.id) closeDetail();
    try {
      await apiClient.deleteAnnouncement(item.id);
    } catch {
      items = previous;
      alert(t.announcementsDeleteFailed);
    }
  }
</script>

<div class="ann-panel">
  {#if selected}
    <!-- ═══ DETAIL VIEW ═══ -->
    {@const title = pickText(selected.title)}
    {@const body = pickText(selected.body)}
    <div class="ann-detail-head">
      <button class="ann-back" type="button" onclick={closeDetail}>‹ {t.announcementsBack}</button>
    </div>
    <div class="ann-detail-card">
      <div class="ann-card-top">
        <span class="ann-chip">{audienceLabel(selected.target)}</span>
        <span class="ann-time">{relativeTime(selected.sentAt)}</span>
      </div>
      <h2 class="ann-detail-title">{title}</h2>
      {#if body}
        <p class="ann-detail-body">{body}</p>
      {/if}
    </div>

    {#if selected.eventId}
      <div class="ann-linked">
        <div class="ornament">{t.announcementsLinkedEvent}</div>
        {#if linkedLoading}
          <p class="ann-muted">{t.loading}</p>
        {:else if linkedEvent}
          <button class="ann-event-card" type="button" onclick={() => onViewEvent(selected!.eventId!)}>
            <span class="ann-event-title">{pickText(linkedEvent.title)}</span>
            <span class="ann-event-date">{formatEventDate(linkedEvent.date)}</span>
            <span class="ann-event-open">{t.announcementsViewEvent} ›</span>
          </button>
        {:else}
          <p class="ann-muted">{t.noEvents}</p>
        {/if}
      </div>
    {/if}

    {#if isAdmin}
      <button class="ann-delete-btn" type="button" onclick={() => doDelete(selected!)}>
        {t.announcementsDelete}
      </button>
    {/if}
  {:else if loading}
    <div class="ann-state">
      <span class="cross-pulse">♱</span>
      <p>{t.loading}</p>
    </div>
  {:else if error}
    <div class="ann-state">
      <p class="ann-error">⚠ {t.announcementsError}</p>
      <button class="ann-retry" type="button" onclick={load}>{t.announcementsRetry}</button>
    </div>
  {:else if items.length === 0}
    <div class="ann-state">
      <span class="ann-bell">🔔</span>
      <p>{t.announcementsEmpty}</p>
    </div>
  {:else}
    <!-- ═══ LIST VIEW ═══ -->
    <div class="ann-head">
      <div class="ornament">{t.announcements}</div>
    </div>
    <ul class="ann-list">
      {#each items as item (item.id)}
        {@const title = pickText(item.title)}
        {@const body = pickText(item.body)}
        <li class="ann-row">
          <button class="ann-card" type="button" onclick={() => openDetail(item)}>
            <div class="ann-card-top">
              <span class="ann-chip">{audienceLabel(item.target)}</span>
              <span class="ann-time">{relativeTime(item.sentAt)}</span>
            </div>
            <h3 class="ann-title">{title}</h3>
            {#if body}
              <p class="ann-body">{body}</p>
            {/if}
            <span class="ann-view">
              {item.eventId ? t.announcementsViewEvent : t.announcementsViewDetails} ›
            </span>
          </button>
          {#if isAdmin}
            <button
              class="ann-row-delete"
              type="button"
              title={t.announcementsDelete}
              aria-label={t.announcementsDelete}
              onclick={() => doDelete(item)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6" />
              </svg>
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .ann-panel {
    display: grid;
    gap: 0.9rem;
    padding-bottom: 0.35rem;
  }

  .ann-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ann-state {
    text-align: center;
    padding: 2.5rem 1rem;
    color: var(--ink-muted);
  }
  .ann-state p {
    margin: 0.5rem 0 0;
  }
  .ann-error {
    color: var(--crimson);
    font-weight: 600;
  }
  .cross-pulse {
    display: inline-block;
    font-size: 2rem;
    color: var(--gold);
    animation: annPulse 2s ease-in-out infinite;
  }
  @keyframes annPulse {
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
  .ann-bell {
    font-size: 2rem;
    opacity: 0.55;
  }
  .ann-retry {
    margin-top: 0.8rem;
    padding: 0.45rem 1.1rem;
    background: var(--wine);
    color: var(--gold-pale);
    border: none;
    border-radius: 999px;
    font-family: var(--sans);
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }
  .ann-retry:hover {
    background: var(--wine-soft);
  }

  .ann-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
  }

  .ann-row {
    position: relative;
    display: block;
  }

  .ann-card {
    display: grid;
    gap: 0.35rem;
    width: 100%;
    text-align: left;
    padding: 0.9rem 1rem;
    border: 1px solid var(--line-light);
    border-radius: var(--r-md);
    background: var(--surface-white);
    box-shadow: var(--shadow-warm);
    cursor: pointer;
    font: inherit;
    color: inherit;
    transition:
      border-color 0.15s ease,
      transform 0.1s ease;
  }
  .ann-card:hover {
    border-color: var(--gold);
    transform: translateY(-1px);
  }

  .ann-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .ann-chip {
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: var(--gold-glow);
    border: 1px solid var(--gold-dim);
    color: var(--wine);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .ann-time {
    margin-left: auto;
    font-size: 0.74rem;
    color: var(--ink-muted);
    white-space: nowrap;
  }

  .ann-title {
    margin: 0;
    font-family: var(--serif);
    font-size: 1.15rem;
    line-height: 1.35;
    color: var(--wine);
  }

  .ann-body {
    margin: 0;
    line-height: 1.55;
    color: var(--ink-body);
    font-size: 0.92rem;
    white-space: pre-line;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ann-view {
    color: var(--wine);
    font-family: var(--sans);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .ann-row-delete {
    position: absolute;
    top: 0.55rem;
    right: 0.55rem;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--parchment);
    color: var(--ink-muted);
    cursor: pointer;
    transition: all 0.15s;
  }
  .ann-row-delete:hover {
    background: var(--crimson);
    border-color: var(--crimson);
    color: #fff;
  }

  /* ── Detail view ── */
  .ann-detail-head {
    display: flex;
  }
  .ann-back {
    padding: 0.3rem 0.6rem;
    background: none;
    border: none;
    color: var(--wine);
    font-family: var(--sans);
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
  }
  .ann-back:hover {
    color: var(--gold);
  }
  .ann-detail-card {
    display: grid;
    gap: 0.5rem;
    padding: 1rem 1.1rem;
    border: 1px solid var(--line-light);
    border-radius: var(--r-md);
    background: var(--surface-white);
    box-shadow: var(--shadow-warm);
  }
  .ann-detail-title {
    margin: 0.2rem 0 0;
    font-family: var(--serif);
    font-size: 1.5rem;
    color: var(--wine);
    line-height: 1.3;
  }
  .ann-detail-body {
    margin: 0;
    line-height: 1.6;
    color: var(--ink-body);
    white-space: pre-line;
  }

  .ann-linked {
    display: grid;
    gap: 0.6rem;
  }
  .ann-event-card {
    display: grid;
    gap: 0.2rem;
    text-align: left;
    width: 100%;
    padding: 0.85rem 0.95rem;
    border: 1px solid var(--line-light);
    border-radius: var(--r-md);
    background: var(--surface-white);
    cursor: pointer;
    font: inherit;
    transition:
      border-color 0.15s ease,
      transform 0.1s ease;
  }
  .ann-event-card:hover {
    border-color: var(--gold);
    transform: translateY(-1px);
  }
  .ann-event-title {
    font-family: var(--serif);
    font-size: 1.05rem;
    color: var(--wine);
    font-weight: 600;
  }
  .ann-event-date {
    font-size: 0.82rem;
    color: var(--ink-muted);
  }
  .ann-event-open {
    font-family: var(--sans);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--wine);
    margin-top: 0.2rem;
  }
  .ann-muted {
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.88rem;
  }

  .ann-delete-btn {
    justify-self: start;
    padding: 0.55rem 1.2rem;
    background: transparent;
    color: var(--crimson);
    border: 1px solid var(--crimson);
    border-radius: 999px;
    font-family: var(--sans);
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ann-delete-btn:hover {
    background: var(--crimson);
    color: #fff;
  }
</style>
