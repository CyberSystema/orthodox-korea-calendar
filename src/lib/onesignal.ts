declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
  }
}

let initialized = false;

function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

function isTopLevelWindow(): boolean {
  try {
    return window.top === window.self;
  } catch {
    return false;
  }
}

function loadOneSignalSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-onesignal-sdk="true"]');
    if (existing) {
      if ((existing as any).__loaded) return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('OneSignal SDK failed to load')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.dataset.onesignalSdk = 'true';
    script.addEventListener(
      'load',
      () => {
        (script as any).__loaded = true;
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error('OneSignal SDK failed to load')), {
      once: true,
    });

    document.head.appendChild(script);
  });
}

async function promptForPushOnFirstInteraction(OneSignal: any) {
  const permission = getBrowserNotificationPermission();
  if (permission !== 'default') return;

  const tryPrompt = async () => {
    try {
      if (typeof OneSignal?.Slidedown?.promptPush === 'function') {
        await OneSignal.Slidedown.promptPush();
      } else if (typeof OneSignal?.Notifications?.requestPermission === 'function') {
        await OneSignal.Notifications.requestPermission();
      }
    } catch {
      // Ignore prompt errors; user can still subscribe later.
    }
  };

  const handler = () => {
    void tryPrompt();
  };

  window.addEventListener('pointerdown', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
}

async function restorePushSubscription(OneSignal: any) {
  if (getBrowserNotificationPermission() !== 'granted') return;

  const hasActiveSubscription = () => {
    const subscription = OneSignal?.User?.PushSubscription;
    return Boolean(subscription?.optedIn && subscription?.id);
  };

  if (hasActiveSubscription()) return;

  const tryOptIn = async () => {
    try {
      await OneSignal.User.PushSubscription.optIn();
    } catch {
      // Best-effort.
    }
  };

  await tryOptIn();
  if (hasActiveSubscription()) return;

  try {
    await navigator.serviceWorker.ready;
  } catch {
    // Ignore readiness failures and continue with a timed retry.
  }

  await new Promise((resolve) => window.setTimeout(resolve, 750));
  await tryOptIn();
}

export async function updateLanguageTag(lang: 'en' | 'kr'): Promise<void> {
  const tag = lang === 'kr' ? 'ko' : 'en';
  // If OneSignal is already initialized, update the tag directly.
  // OneSignalDeferred is only processed once at SDK init and won't re-run.
  try {
    const OS = (window as any).OneSignal;
    if (OS?.User?.addTag) {
      await OS.User.addTag('language', tag);
      return;
    }
  } catch {
    // Fall through to deferred queue if direct call fails.
  }
  // SDK not yet initialized — queue the tag for when it initializes.
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.User.addTag('language', tag);
    } catch {
      // Best-effort: ignore errors.
    }
  });
}

export async function initOneSignal(lang: 'en' | 'kr'): Promise<void> {
  if (initialized) return;
  initialized = true;

  const appId = (import.meta.env.VITE_ONESIGNAL_APP_ID || '').trim();
  if (!appId) return;

  // Browsers commonly block notifications in embedded iframes.
  if (!isTopLevelWindow()) return;

  try {
    await loadOneSignalSdk();

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId,
        autoResubscribe: true,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerParam: { scope: '/' },
      });

      // Tag subscriber with their language preference for targeted notifications.
      // Backend audience filters use this tag for English/Korean targeting.
      try {
        await OneSignal.User.addTag('language', lang === 'kr' ? 'ko' : 'en');
      } catch {
        // Tagging is best-effort; don't block the notification prompt.
      }

      // After cache/site-data changes, permission may still be granted while the local
      // subscription record is gone. Restore it before deciding whether to prompt.
      await restorePushSubscription(OneSignal);

      await promptForPushOnFirstInteraction(OneSignal);
    });
  } catch {
    // Silent fail: calendar should still work without push.
  }
}
