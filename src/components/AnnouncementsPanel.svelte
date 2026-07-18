<script lang="ts">
  import { onMount } from 'svelte';
  import type { Translations } from '../lib/i18n';
  import type { Language } from '../lib/types';
  import { apiClient } from '../lib/apiClient';
  import type { ApiAnnouncement } from '../lib/sdk';

  let { t, lang, onViewEvent } = $props<{
    t: Translations;
    lang: Language;
    onViewEvent: (eventId: string) => void;
  }>();

  let loading = $state(true);
  let error = $state(false);
  let items = $state<ApiAnnouncement[]>([]);

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

  function audienceLabel(target: ApiAnnouncement['target']): string | null {
    if (target === 'en') return t.announcementsAudienceEn;
    if (target === 'ko') return t.announcementsAudienceKo;
    return null;
  }

  // Self-contained localized relative time from Unix epoch seconds. Falls back to an
  // absolute date once older than a week.
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
</script>

<div class="ann-panel">
  <div class="ann-head">
    <div class="ornament">{t.announcements}</div>
  </div>

  {#if loading}
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
    <ul class="ann-list">
      {#each items as item (item.id)}
        {@const title = pickText(item.title)}
        {@const body = pickText(item.body)}
        {@const audience = audienceLabel(item.target)}
        <li class="ann-card">
          <div class="ann-card-top">
            {#if audience}
              <span class="ann-chip">{audience}</span>
            {/if}
            <span class="ann-time">{relativeTime(item.sentAt)}</span>
          </div>
          <h3 class="ann-title">{title}</h3>
          {#if body}
            <p class="ann-body">{body}</p>
          {/if}
          {#if item.eventId}
            <button class="ann-view" type="button" onclick={() => onViewEvent(item.eventId!)}>
              {t.announcementsViewEvent} ›
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

  .ann-card {
    padding: 0.9rem 1rem;
    border: 1px solid var(--line-light);
    border-radius: var(--r-md);
    background: var(--surface-white);
    display: grid;
    gap: 0.35rem;
    box-shadow: var(--shadow-warm);
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
  }

  .ann-view {
    justify-self: start;
    margin-top: 0.15rem;
    padding: 0;
    background: none;
    border: none;
    color: var(--wine);
    font-family: var(--sans);
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
  }
  .ann-view:hover {
    color: var(--gold);
    text-decoration: underline;
  }
</style>
