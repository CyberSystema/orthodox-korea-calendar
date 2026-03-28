<script lang="ts">
  import { currentMonth, currentYear, selectedDay } from '../lib/store';
  import { getMonthMatrix } from '../lib/date';
  import DayCell from './DayCell.svelte';
  import type { DayData, ParishEvent } from '../lib/types';
  import type { Translations } from '../lib/i18n';

  let {
    data,
    t,
    events = [],
  } = $props<{ data: DayData[]; t: Translations; events?: ParishEvent[] }>();

  let matrix = $derived(getMonthMatrix($currentYear, $currentMonth, data));

  // Set of dates that have parish events
  let eventDates = $derived(new Set(events.map((e: ParishEvent) => e.date)));

  const weekdaysEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdaysKR = ['일', '월', '화', '수', '목', '금', '토'];
  let weekdays = $derived(t.close === 'Close' ? weekdaysEN : weekdaysKR);

  function selectDay(dayData: DayData | undefined) {
    if (dayData) selectedDay.set(dayData);
  }
</script>

<div class="grid-frame">
  <div class="wd-row">
    {#each weekdays as wd, i}
      <div class="wd" class:wd-sun={i === 0}>{wd}</div>
    {/each}
  </div>
  <div class="day-grid">
    {#each matrix as cell}
      {#if cell.date}
        <DayCell
          {cell}
          onSelect={() => selectDay(cell.data)}
          hasEvents={cell.data ? eventDates.has(cell.data.date) : false}
        />
      {:else}
        <div class="empty"></div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .grid-frame {
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    overflow: hidden;
    box-shadow: var(--shadow-warm);
    background: var(--line-light);
  }
  .wd-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--wine-deep);
    border-bottom: 2.5px solid var(--gold);
  }
  .wd {
    text-align: center;
    padding: 0.6rem 0;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--ink-faint);
  }
  .wd-sun {
    color: var(--gold-bright);
  }
  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: var(--line-light);
  }
  .empty {
    min-height: 105px;
    background: var(--surface);
  }

  @media (max-width: 680px) {
    .wd {
      font-size: 0.62rem;
      padding: 0.45rem 0;
    }
    .empty {
      min-height: 68px;
    }
  }
</style>
