<script lang="ts">
  import type { Translations } from '../lib/i18n';
  import type { ParishEvent, Recurrence, NotificationTarget } from '../lib/types';
  import { isAdmin, setPasscode, clearPasscode, refreshEvents } from '../lib/store';
  import {
    BackendApiError,
    createEvent,
    loginAdmin,
    notifySubscribers,
    updateEvent,
  } from '../lib/events';

  let {
    t,
    year,
    onClose,
    editingEvent = null,
    prefillDate = '',
  } = $props<{
    t: Translations;
    year: number;
    onClose: () => void;
    editingEvent?: ParishEvent | null;
    prefillDate?: string;
  }>();

  let mode = $derived($isAdmin ? 'form' : 'auth');

  // ── Auth state ──
  let passcodeInput = $state('');
  let authError = $state(false);
  let authLoading = $state(false);
  let authErrorText = $state('');
  let authLockedUntil = $state(0);

  // ── Form state (captured at mount — modal remounts each time) ──
  // svelte-ignore state_referenced_locally
  let formDate = $state(editingEvent?.seriesStartDate ?? editingEvent?.date ?? prefillDate ?? '');
  // svelte-ignore state_referenced_locally
  let formTitleEn = $state(editingEvent?.titleEn ?? editingEvent?.title ?? '');
  // svelte-ignore state_referenced_locally
  let formTitleKo = $state(editingEvent?.titleKo ?? '');
  // svelte-ignore state_referenced_locally
  let formDescEn = $state(editingEvent?.descriptionEn ?? editingEvent?.description ?? '');
  // svelte-ignore state_referenced_locally
  let formDescKo = $state(editingEvent?.descriptionKo ?? '');
  // svelte-ignore state_referenced_locally
  let formAllDay = $state(editingEvent?.allDay ?? true);
  let formNotify = $state(true);
  let formNotificationTarget = $state<NotificationTarget>('all');
  // svelte-ignore state_referenced_locally
  let formRecurrence = $state<Recurrence>(editingEvent?.recurrence ?? 'none');
  // svelte-ignore state_referenced_locally
  let formRecurrenceInterval = $state(editingEvent?.recurrenceInterval ?? 1);
  // svelte-ignore state_referenced_locally
  let formRecurrenceUntil = $state(editingEvent?.recurrenceUntil ?? '');
  let formLoading = $state(false);
  let formError = $state('');
  let hasAnyTitle = $derived(Boolean(formTitleEn.trim() || formTitleKo.trim()));

  let recurrenceOptions = $derived<Array<{ value: Recurrence; label: string }>>([
    { value: 'none', label: t.recurrenceNone },
    { value: 'daily', label: t.recurrenceDaily },
    { value: 'weekly', label: t.recurrenceWeekly },
    { value: 'monthly', label: t.recurrenceMonthly },
  ]);

  let notificationTargetOptions = $derived<Array<{ value: NotificationTarget; label: string }>>([
    { value: 'all', label: t.notificationAll },
    { value: 'english', label: t.notificationEnglish },
    { value: 'korean', label: t.notificationKorean },
  ]);

  function rateLimitHint(retryAfter?: number): string {
    if (retryAfter === undefined) return 'Too many attempts. Please try again shortly.';
    if (retryAfter < 60) return `Too many attempts. Try again in ${retryAfter}s.`;
    return `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)}m.`;
  }

  function errorMessageFromApi(error: unknown, fallback: string): string {
    if (error instanceof BackendApiError) {
      if (error.code === 'RATE_LIMITED') return rateLimitHint(error.retryAfter);
      if (error.code === 'UNAUTHORIZED') return t.wrongPasscode;
      return error.message || fallback;
    }
    if (error instanceof Error) return error.message || fallback;
    return fallback;
  }

  function recurrencePayload() {
    if (formRecurrence === 'none' || formRecurrence === 'yearly') return null;
    return {
      frequency: formRecurrence,
      interval: Math.max(1, Number(formRecurrenceInterval) || 1),
      until: formRecurrenceUntil || undefined,
    };
  }

  async function handleAuth() {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (authLockedUntil > nowSeconds) {
      authError = true;
      authErrorText = rateLimitHint(authLockedUntil - nowSeconds);
      return;
    }

    authError = false;
    authErrorText = '';
    authLoading = true;

    try {
      const session = await loginAdmin(passcodeInput);
      setPasscode(session.token);
      isAdmin.set(true);
      passcodeInput = '';
      if (!editingEvent && !prefillDate) {
        onClose();
      }
    } catch (error) {
      authError = true;
      authErrorText = errorMessageFromApi(error, t.wrongPasscode);
      if (error instanceof BackendApiError && error.code === 'RATE_LIMITED') {
        const retryAfter = error.retryAfter || 30;
        authLockedUntil = Math.floor(Date.now() / 1000) + retryAfter;
      }
    } finally {
      authLoading = false;
    }
  }

  async function handleSubmit() {
    if (!formDate || !hasAnyTitle) {
      formError = t.eventTitleRequiredOneLanguage;
      return;
    }
    formLoading = true;
    formError = '';

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          date: formDate,
          titleEn: formTitleEn,
          titleKo: formTitleKo,
          descriptionEn: formDescEn,
          descriptionKo: formDescKo,
          allDay: formAllDay,
          recurrence: recurrencePayload(),
        });
      } else {
        const created = await createEvent({
          date: formDate,
          titleEn: formTitleEn,
          titleKo: formTitleKo,
          descriptionEn: formDescEn,
          descriptionKo: formDescKo,
          allDay: formAllDay,
          recurrence: recurrencePayload() || undefined,
        });

        if (formNotify) {
          await notifySubscribers({
            eventId: created.id,
            target: formNotificationTarget,
          });
        }
      }
      await refreshEvents();
      onClose();
    } catch (error) {
      formError = errorMessageFromApi(error, 'Failed to save');
      if (error instanceof BackendApiError && error.code === 'UNAUTHORIZED') {
        isAdmin.set(false);
        clearPasscode();
      }
    } finally {
      formLoading = false;
    }
  }

  function handleAuthKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAuth();
  }
</script>

<div class="admin-panel">
  {#if mode === 'auth'}
    <!-- Passcode Entry -->
    <div class="auth-card">
      <div class="auth-icon">🔐</div>
      <p class="auth-label">{t.enterPasscode}</p>
      <input
        type="password"
        class="auth-input"
        bind:value={passcodeInput}
        onkeydown={handleAuthKeydown}
        placeholder={t.passcode}
        autocomplete="off"
      />
      {#if authError}
        <p class="auth-err">{authErrorText || t.wrongPasscode}</p>
      {/if}
      <div class="auth-actions">
        <button class="btn btn-ghost" onclick={onClose}>{t.cancel}</button>
        <button
          class="btn btn-primary"
          onclick={handleAuth}
          disabled={authLoading || !passcodeInput}
        >
          {authLoading ? '…' : t.unlock}
        </button>
      </div>
    </div>
  {:else}
    <!-- Event Form -->
    <div class="form-card">
      <h3 class="form-title">{editingEvent ? t.editEvent : t.addEvent}</h3>

      {#if prefillDate && !editingEvent}
        <div class="field">
          <span class="field-label">{t.eventDate}</span>
          <div class="field-date-locked">{formDate}</div>
        </div>
      {:else}
        <label class="field">
          <span class="field-label">{t.eventDate}</span>
          <input type="date" class="field-input" bind:value={formDate} />
        </label>
      {/if}

      <label class="field">
        <span class="field-label">{t.eventTitleEn}</span>
        <input type="text" class="field-input" bind:value={formTitleEn} placeholder="" />
      </label>

      <label class="field">
        <span class="field-label">{t.eventTitleKo}</span>
        <input type="text" class="field-input" bind:value={formTitleKo} placeholder="" />
      </label>

      <label class="field">
        <span class="field-label">{t.eventDescriptionEn}</span>
        <textarea class="field-input field-textarea" bind:value={formDescEn} rows="3"></textarea>
      </label>

      <label class="field">
        <span class="field-label">{t.eventDescriptionKo}</span>
        <textarea class="field-input field-textarea" bind:value={formDescKo} rows="3"></textarea>
      </label>

      <label class="field">
        <span class="field-label">{t.recurrence}</span>
        <select class="field-input" bind:value={formRecurrence}>
          {#each recurrenceOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="field-check">
        <input type="checkbox" bind:checked={formAllDay} />
        <span>{t.allDay}</span>
      </label>

      {#if formRecurrence !== 'none'}
        <label class="field">
          <span class="field-label">{t.recurrenceInterval}</span>
          <input
            type="number"
            min="1"
            step="1"
            class="field-input"
            bind:value={formRecurrenceInterval}
          />
        </label>

        <label class="field">
          <span class="field-label">{t.recurrenceUntil}</span>
          <input type="date" class="field-input" bind:value={formRecurrenceUntil} />
        </label>
      {/if}

      {#if !editingEvent}
        <label class="field-check">
          <input type="checkbox" bind:checked={formNotify} />
          <span>{t.sendNotification}</span>
        </label>

        {#if formNotify}
          <label class="field">
            <span class="field-label">{t.notificationTarget}</span>
            <select class="field-input" bind:value={formNotificationTarget}>
              {#each notificationTargetOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </label>
        {/if}
      {/if}

      {#if formError}
        <p class="form-err">{formError}</p>
      {/if}

      <div class="form-actions">
        <button class="btn btn-ghost" onclick={onClose}>{t.cancel}</button>
        <button
          class="btn btn-primary"
          onclick={handleSubmit}
          disabled={formLoading || !formDate || !hasAnyTitle}
        >
          {formLoading ? '…' : t.save}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .admin-panel {
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* ── Auth ── */
  .auth-card {
    text-align: center;
    padding: 0.5rem 0;
  }
  .auth-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  .auth-label {
    font-size: 0.9rem;
    color: var(--ink-muted);
    margin: 0 0 0.8rem;
  }
  .auth-input {
    width: 100%;
    padding: 0.5rem 0.7rem;
    border: 1.5px solid var(--line);
    border-radius: var(--r-md);
    font-family: var(--sans);
    font-size: 0.9rem;
    background: var(--surface-white);
    color: var(--ink);
    outline: none;
    text-align: center;
    margin-bottom: 0.5rem;
  }
  .auth-input:focus {
    border-color: var(--gold);
  }
  .auth-err {
    color: var(--crimson);
    font-size: 0.82rem;
    font-weight: 600;
    margin: 0.4rem 0 0;
  }
  .auth-actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  /* ── Form ── */
  .form-card {
    padding: 0.2rem 0;
  }
  .form-title {
    font-family: var(--serif);
    font-size: 1.2rem;
    color: var(--wine);
    margin: 0 0 1rem;
  }

  .field {
    display: block;
    margin-bottom: 0.75rem;
  }
  .field-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.25rem;
  }
  .field-input {
    width: 100%;
    padding: 0.5rem 0.7rem;
    border: 1.5px solid var(--line);
    border-radius: var(--r-md);
    font-family: var(--sans);
    font-size: 0.9rem;
    background: var(--surface-white);
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s;
  }
  .field-input:focus {
    border-color: var(--gold);
  }
  .field-date-locked {
    width: 100%;
    padding: 0.5rem 0.7rem;
    border: 1.5px solid var(--line);
    border-radius: var(--r-md);
    font-family: var(--sans);
    font-size: 0.9rem;
    background: var(--surface);
    color: var(--ink-muted);
    box-sizing: border-box;
  }
  .field-textarea {
    resize: vertical;
    min-height: 60px;
  }

  .field-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--ink-soft);
    margin-bottom: 0.75rem;
    cursor: pointer;
  }
  .field-check input[type='checkbox'] {
    accent-color: var(--gold);
    width: 16px;
    height: 16px;
  }

  .form-err {
    color: var(--crimson);
    font-size: 0.82rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  /* ── Buttons ── */
  .btn {
    padding: 0.45rem 1rem;
    border-radius: 99px;
    font-family: var(--sans);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-primary {
    background: var(--wine);
    color: var(--gold-pale);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--wine-soft);
  }
  .btn-ghost {
    background: transparent;
    color: var(--ink-muted);
    border: 1.5px solid var(--line);
  }
  .btn-ghost:hover {
    border-color: var(--ink-faint);
    color: var(--ink-soft);
  }
</style>
