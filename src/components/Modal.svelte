<script lang="ts">
    import type { Snippet } from 'svelte'

    let { open, onClose, children } = $props<{
        open: boolean,
        onClose: () => void,
        children: Snippet
    }>()

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') onClose()
    }
    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) onClose()
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="overlay" onclick={handleBackdropClick} tabindex="-1" role="presentation">
        <div class="dialog" role="dialog" aria-modal="true">
            <!-- Gold accent band -->
            <div class="dialog-band"></div>

            <button class="close-btn" onclick={onClose} aria-label="Close">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>

            <div class="dialog-body">
                {@render children()}
            </div>

            <!-- Bottom ornamental cross -->
            <div class="dialog-foot">♱</div>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(26, 16, 8, 0.45);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        padding: 1rem;
        animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .dialog {
        background: var(--parchment-light);
        border-radius: var(--r-lg);
        max-width: 520px;
        width: 100%;
        max-height: 85vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
        box-shadow: var(--shadow-deep), 0 0 0 1px var(--line);
        animation: rise 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes rise {
        from { opacity: 0; transform: translateY(14px) scale(0.98); }
        to { opacity: 1; transform: none; }
    }

    .dialog-band {
        height: 3px;
        flex-shrink: 0;
        background: linear-gradient(90deg, transparent, var(--gold), var(--gold-bright), var(--gold), transparent);
    }

    .dialog-body {
        overflow-y: auto;
        padding: 1.2rem 1.5rem 0.6rem;
        flex: 1;
    }

    .dialog-foot {
        text-align: center;
        padding: 0.35rem;
        font-size: 0.85rem;
        color: var(--gold);
        opacity: 0.35;
        flex-shrink: 0;
        border-top: 1px solid var(--line-light);
    }

    .close-btn {
        position: absolute;
        top: 0.7rem;
        right: 0.7rem;
        z-index: 5;
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
    .close-btn:hover {
        background: var(--crimson);
        border-color: var(--crimson);
        color: #fff;
    }
</style>
