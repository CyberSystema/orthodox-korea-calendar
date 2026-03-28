<script lang="ts">
  import type { CalendarCell } from '../lib/date';

  let {
    cell,
    onSelect,
    hasEvents = false,
  } = $props<{ cell: CalendarCell; onSelect: () => void; hasEvents?: boolean }>();

  let isSunday = $derived(cell.date?.getDay() === 0);
  let hasData = $derived(!!cell.data);
  let isHigh = $derived(cell.data?.content[0]?.fields.high_rank ?? false);
  let title = $derived(cell.data?.content[0]?.fields.title ?? '');
  let hasFast = $derived(cell.data?.fast ?? false);
  let hasDL = $derived(cell.data?.dl ?? false);
  let hasPres = $derived(cell.data?.pres ?? false);
  let hasBasil = $derived(cell.data?.saint_basil ?? false);
  let hasAnyFlag = $derived(hasFast || hasDL || hasPres || hasBasil);
</script>

<button
  class="day"
  class:today={cell.isToday}
  class:sunday={isSunday}
  class:high-rank={isHigh}
  onclick={onSelect}
>
  <span class="num" class:num-red={isSunday || isHigh}>{cell.date?.getDate()}</span>

  {#if cell.isToday}
    <span class="today-mark"></span>
  {/if}

  {#if hasData}
    <span class="title" class:title-red={isHigh || isSunday}>{title}</span>
  {/if}

  {#if hasAnyFlag || hasEvents}
    <div class="pips">
      {#if hasFast}<span class="pip pip-fast"></span>{/if}
      {#if hasDL}<span class="pip pip-lit"></span>{/if}
      {#if hasPres}<span class="pip pip-pres"></span>{/if}
      {#if hasBasil}<span class="pip pip-basil"></span>{/if}
      {#if hasEvents}<span class="pip pip-event"></span>{/if}
    </div>
  {/if}
</button>

<style>
  .day {
    min-height: 105px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.4rem 0.25rem;
    background: var(--surface-white);
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: center;
    width: 100%;
    position: relative;
    transition: background 0.12s;
    -webkit-appearance: none;
    appearance: none;
  }
  .day:hover {
    background: var(--gold-glow);
    box-shadow: inset 0 0 0 1.5px var(--gold);
    z-index: 1;
  }

  .day.today {
    background: rgba(184, 148, 46, 0.07);
    box-shadow: inset 0 0 0 2.5px var(--gold);
  }
  .day.today:hover {
    background: rgba(184, 148, 46, 0.12);
  }
  .day.sunday {
    background: rgba(140, 27, 27, 0.03);
  }
  .day.sunday.today {
    background: rgba(184, 148, 46, 0.07);
    box-shadow: inset 0 0 0 2.5px var(--gold);
  }
  .day.high-rank {
    background: rgba(140, 27, 27, 0.05);
  }

  /* ── Number ── */
  .num {
    font-family: var(--serif);
    font-weight: 600;
    font-size: 1.35rem;
    line-height: 1;
    color: var(--ink);
    margin-bottom: 0.2rem;
  }
  .num-red {
    color: var(--crimson);
  }

  /* ── Today dot ── */
  .today-mark {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold-bright);
    margin-bottom: 0.15rem;
    box-shadow: 0 0 6px rgba(212, 175, 82, 0.5);
  }

  /* ── Title ── */
  .title {
    font-size: 0.72rem;
    font-weight: 400;
    line-height: 1.3;
    color: var(--ink-muted);
    overflow: hidden;
    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    max-width: 100%;
    word-break: break-word;
  }
  .title-red {
    color: var(--crimson);
    font-weight: 600;
  }

  /* ── Flag pips ── */
  .pips {
    display: flex;
    gap: 3px;
    margin-top: auto;
    padding-top: 0.15rem;
  }
  .pip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }
  .pip-fast {
    background: #6d3cad;
  }
  .pip-lit {
    background: var(--gold);
  }
  .pip-pres {
    background: #3060b8;
  }
  .pip-basil {
    background: #a85c20;
  }
  .pip-event {
    background: #3060b8;
  }

  @media (max-width: 680px) {
    .day {
      min-height: 68px;
      padding: 0.25rem 0.12rem;
    }
    .num {
      font-size: 1.1rem;
    }
    .title {
      font-size: 0.6rem;
      line-clamp: 2;
      -webkit-line-clamp: 2;
    }
    .today-mark {
      width: 4px;
      height: 4px;
    }
  }
</style>
