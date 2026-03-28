<script lang="ts">
    import type { DayData, Language } from '../lib/types'
    import type { Translations } from '../lib/i18n'

    let { day, t, lang } = $props<{
        day: DayData | null,
        t: Translations,
        lang: Language
    }>()

    let locale = $derived(lang === 'en' ? 'en' : 'ko')
    let now = $derived(new Date())
    let dayOfWeek = $derived(now.toLocaleDateString(locale, { weekday: 'long' }))
    let dayNum = $derived(now.getDate())
    let monthName = $derived(now.toLocaleDateString(locale, { month: 'long' }))
    let year = $derived(now.getFullYear())
</script>

<article class="card">
    <!-- Header -->
    <div class="card-head">
        <div class="head-left">
            <span class="head-cross">♱</span>
            <span class="head-label">{t.today}</span>
        </div>
    </div>

    <!-- Date display -->
    <div class="date-area">
        <div class="date-ring"><span>{dayNum}</span></div>
        <div class="date-text">
            <span class="date-wday">{dayOfWeek}</span>
            <span class="date-my">{monthName} {year}</span>
        </div>
    </div>

    {#if day}
        <!-- Flags -->
        {#if day.fast || day.cheese || day.fish || day.pres || day.saint_basil || day.dl}
            <div class="flags-strip">
                {#if day.fast}<div class="fl"><img src="/fast.jpeg" alt="" /><span>{t.fast}</span></div>{/if}
                {#if day.cheese}<div class="fl"><img src="/cheese.jpeg" alt="" /><span>{t.cheese}</span></div>{/if}
                {#if day.fish}<div class="fl"><img src="/fish.jpeg" alt="" /><span>{t.fish}</span></div>{/if}
                {#if day.pres}<div class="fl"><img src="/pres.jpeg" alt="" /><span>{t.pres}</span></div>{/if}
                {#if day.saint_basil}<div class="fl"><img src="/bas_lit.jpeg" alt="" /><span>{t.basil}</span></div>{/if}
                {#if day.dl}<div class="fl"><img src="/div_lit.jpeg" alt="" /><span>{t.dl}</span></div>{/if}
            </div>
        {/if}

        <!-- Readings -->
        {#if day.readings.length}
            <div class="sec">
                <div class="ornament">{t.readings}</div>
                <div class="readings">
                    {#each day.readings as reading}
                        <span class="rtag">{reading}</span>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Celebrations -->
        <div class="sec">
            <div class="ornament">{t.celebrations}</div>
            <ul class="clist">
                {#each day.content as entry}
                    <li class="ci" class:hi={entry.fields.high_rank} class:feast={entry.fields.celeb}>
                        <span class="cn">{entry.fields.title}</span>
                        {#if entry.fields.readings?.length}
                            <span class="cm">📖 {entry.fields.readings}</span>
                        {/if}
                        {#if entry.fields.tone}
                            <span class="cm">🎵 {t.tone} {entry.fields.tone}</span>
                        {/if}
                        {#if entry.fields.m_gosp}
                            <span class="cm">📜 {t.matins} {entry.fields.m_gosp}</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        </div>
    {:else}
        <div class="no-data"><p>{t.noData}</p></div>
    {/if}

    <!-- Footer -->
    <div class="card-foot">
        <span>♱</span>
        <span>Orthodox Korea</span>
    </div>
</article>

<style>
    .card {
        width: 100%;
        max-width: 460px;
        margin: 0 auto;
        background: var(--parchment-light);
        border: 1px solid var(--line);
        overflow: hidden;
        animation: cardIn 0.4s ease;
    }
    @keyframes cardIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: none; }
    }

    /* ── Header strip ── */
    .card-head {
        background: var(--wine-deep);
        padding: 0.55rem 1.2rem;
        border-bottom: 2.5px solid var(--gold);
    }
    .head-left {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .head-cross {
        color: var(--gold-bright);
        font-size: 1.1rem;
    }
    .head-label {
        font-family: var(--serif);
        font-size: 0.88rem;
        font-weight: 500;
        color: var(--gold-pale);
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    /* ── Date ── */
    .date-area {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding: 1.1rem 1.3rem;
        border-bottom: 1px solid var(--line-light);
    }
    .date-ring {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 2.5px solid var(--crimson);
        color: var(--crimson);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-family: var(--serif);
        font-size: 1.65rem;
        font-weight: 700;
        line-height: 1;
    }
    .date-text { display: flex; flex-direction: column; gap: 0.05rem; }
    .date-wday {
        font-family: var(--serif);
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--wine);
    }
    .date-my {
        font-size: 0.82rem;
        color: var(--ink-muted);
        font-weight: 500;
    }

    /* ── Flags ── */
    .flags-strip {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        padding: 0.7rem 1.3rem;
        background: var(--parchment);
        border-bottom: 1px solid var(--line-light);
    }
    .fl {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.15rem 0.45rem 0.15rem 0.15rem;
        background: var(--surface-white);
        border: 1px solid var(--line);
        border-radius: 99px;
    }
    .fl img { height: 20px; border-radius: 50%; }
    .fl span { font-size: 0.7rem; font-weight: 600; color: var(--ink-soft); }

    /* ── Sections ── */
    .sec {
        padding: 0.8rem 1.3rem;
        border-bottom: 1px solid var(--line-light);
    }
    .sec:last-of-type { border-bottom: none; }

    .readings {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        margin-top: 0.45rem;
    }
    .rtag {
        padding: 0.18rem 0.55rem;
        background: var(--gold-glow);
        border: 1px solid var(--gold);
        border-radius: 99px;
        font-family: var(--serif);
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--ink-body);
    }

    /* ── Celebrations ── */
    .clist {
        list-style: none;
        padding: 0;
        margin: 0.45rem 0 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }
    .ci {
        padding: 0.4rem 0.6rem;
        border-left: 2.5px solid var(--line);
        border-radius: 0 var(--r-sm) var(--r-sm) 0;
        background: var(--surface-white);
    }
    .ci.hi {
        border-left-color: var(--crimson);
        background: rgba(140, 27, 27, 0.04);
    }
    .ci.feast {
        border-left-color: var(--gold);
        background: var(--gold-glow);
    }
    .cn {
        display: block;
        font-weight: 600;
        font-size: 0.88rem;
        line-height: 1.35;
        white-space: pre-line;
    }
    .ci.hi .cn { color: var(--crimson); }
    .ci.feast .cn { color: var(--ink-soft); font-style: italic; }
    .cm {
        display: block;
        font-size: 0.75rem;
        color: var(--ink-muted);
        font-style: italic;
        margin-top: 0.1rem;
    }

    /* ── Footer ── */
    .card-foot {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.5rem;
        font-family: var(--serif);
        font-size: 0.75rem;
        color: var(--ink-faint);
        border-top: 1px solid var(--line-light);
    }

    .no-data {
        padding: 2rem 1.3rem;
        text-align: center;
        color: var(--ink-muted);
        font-style: italic;
    }
</style>
