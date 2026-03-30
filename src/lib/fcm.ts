import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  type Messaging,
  onMessage,
} from 'firebase/messaging';
import { writable } from 'svelte/store';
import { apiClient } from './apiClient';
import { registerSubscription, unregisterSubscription } from './events';

let initialized = false;
let cachedMessaging: Messaging | null = null;
let currentToken = '';
let currentLang: 'en' | 'kr' = 'en';
let cachedFirebaseConfig: FirebaseOptions | null = null;
let cachedVapidKey = '';
let tokenRefreshHooksInstalled = false;

const PUSH_BANNER_DISMISSED_KEY = 'okc_push_banner_dismissed';
export const showPushBanner = writable(false);
export const canReopenPushBanner = writable(false);

function isTopLevelWindow(): boolean {
  try {
    return window.top === window.self;
  } catch {
    return false;
  }
}

function isBannerDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === '1';
}

function setBannerDismissed(value: boolean): void {
  if (typeof localStorage === 'undefined') return;
  if (value) localStorage.setItem(PUSH_BANNER_DISMISSED_KEY, '1');
  else localStorage.removeItem(PUSH_BANNER_DISMISSED_KEY);
}

function toBackendLanguage(lang: 'en' | 'kr'): 'en' | 'ko' {
  return lang === 'kr' ? 'ko' : 'en';
}

function getEnvFallbackConfig(): FirebaseOptions {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

async function ensureFirebaseClientConfig(): Promise<{
  config: FirebaseOptions;
  vapidKey: string;
} | null> {
  if (cachedFirebaseConfig && cachedVapidKey) {
    return { config: cachedFirebaseConfig, vapidKey: cachedVapidKey };
  }

  try {
    const remote = await apiClient.clientConfig();
    cachedFirebaseConfig = {
      apiKey: remote.firebase.apiKey,
      authDomain: remote.firebase.authDomain,
      projectId: remote.firebase.projectId,
      storageBucket: remote.firebase.storageBucket,
      messagingSenderId: remote.firebase.messagingSenderId,
      appId: remote.firebase.appId,
    };
    cachedVapidKey = (remote.firebase.vapidPublicKey || '').trim();
  } catch {
    const fallback = getEnvFallbackConfig();
    const vapid = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
    if (
      !fallback.apiKey ||
      !fallback.projectId ||
      !fallback.messagingSenderId ||
      !fallback.appId ||
      !vapid
    ) {
      return null;
    }
    cachedFirebaseConfig = fallback;
    cachedVapidKey = vapid;
  }

  return { config: cachedFirebaseConfig, vapidKey: cachedVapidKey };
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;
  if (cachedMessaging) return cachedMessaging;

  const prepared = await ensureFirebaseClientConfig();
  if (!prepared) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const app = getApps().length ? getApp() : initializeApp(prepared.config);
  cachedMessaging = getMessaging(app);
  return cachedMessaging;
}

async function registerServiceWorker(
  config: FirebaseOptions,
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  const params = new URLSearchParams({
    apiKey: config.apiKey || '',
    authDomain: config.authDomain || '',
    projectId: config.projectId || '',
    storageBucket: config.storageBucket || '',
    messagingSenderId: config.messagingSenderId || '',
    appId: config.appId || '',
  });

  try {
    return await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params.toString()}`,
      {
        scope: '/',
      },
    );
  } catch {
    return null;
  }
}

async function syncBackendSubscriptionToken(token: string, lang: 'en' | 'kr'): Promise<void> {
  await registerSubscription(token, toBackendLanguage(lang));
}

async function refreshFcmToken(lang: 'en' | 'kr'): Promise<void> {
  const prepared = await ensureFirebaseClientConfig();
  if (!prepared) return;

  const messaging = await getMessagingInstance();
  if (!messaging) return;

  const vapidKey = prepared.vapidKey;
  if (!vapidKey) return;

  const serviceWorkerRegistration = await registerServiceWorker(prepared.config);

  const token = await getToken(messaging, {
    vapidKey,
    ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
  }).catch(() => '');

  if (!token) {
    if (currentToken) {
      await unregisterSubscription(currentToken).catch(() => {});
      currentToken = '';
    }
    return;
  }

  if (currentToken && currentToken !== token) {
    await unregisterSubscription(currentToken).catch(() => {});
  }

  await syncBackendSubscriptionToken(token, lang);
  currentToken = token;
}

async function unsubscribeCurrentToken(): Promise<void> {
  if (!currentToken) return;

  const messaging = await getMessagingInstance();
  if (messaging) {
    await deleteToken(messaging).catch(() => {});
  }

  await unregisterSubscription(currentToken).catch(() => {});
  currentToken = '';
}

function setupTokenRefreshHooks(): void {
  if (typeof window === 'undefined' || tokenRefreshHooksInstalled) return;
  tokenRefreshHooksInstalled = true;

  const refresh = () => {
    void ensureFcmSubscriptionUpToDate();
  };

  window.addEventListener('focus', refresh);
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });

  window.setInterval(refresh, 30 * 60 * 1000);
}

export async function ensureFcmSubscriptionUpToDate(): Promise<void> {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  await refreshFcmToken(currentLang).catch(() => {});
}

export async function requestPushPermission(): Promise<void> {
  try {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await refreshFcmToken(currentLang);
      showPushBanner.set(false);
      canReopenPushBanner.set(false);
      setBannerDismissed(true);
      return;
    }

    if (permission === 'denied') {
      showPushBanner.set(false);
      canReopenPushBanner.set(false);
      setBannerDismissed(true);
      return;
    }

    canReopenPushBanner.set(true);
  } catch {
    // Best effort.
  }
}

export function dismissPushBanner(): void {
  showPushBanner.set(false);
  canReopenPushBanner.set(true);
  setBannerDismissed(true);
}

export function reopenPushBanner(): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'default') return;
  setBannerDismissed(false);
  canReopenPushBanner.set(true);
  showPushBanner.set(true);
}

export async function updateLanguageTag(lang: 'en' | 'kr'): Promise<void> {
  currentLang = lang;
  if (!currentToken) return;
  await syncBackendSubscriptionToken(currentToken, lang).catch(() => {});
}

export async function initFcm(lang: 'en' | 'kr'): Promise<void> {
  currentLang = lang;
  if (initialized) {
    await updateLanguageTag(lang);
    return;
  }
  initialized = true;

  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (!isTopLevelWindow()) return;

  const messaging = await getMessagingInstance();
  if (!messaging) return;

  setupTokenRefreshHooks();

  onMessage(messaging, () => {
    // Foreground message hook intentionally left light; browser notification is handled by FCM.
  });

  const permission = Notification.permission;
  if (permission === 'granted') {
    await refreshFcmToken(lang);
    showPushBanner.set(false);
    canReopenPushBanner.set(false);
    return;
  }

  if (permission === 'denied') {
    await unsubscribeCurrentToken();
    showPushBanner.set(false);
    canReopenPushBanner.set(false);
    return;
  }

  canReopenPushBanner.set(true);
  showPushBanner.set(!isBannerDismissed());
}
