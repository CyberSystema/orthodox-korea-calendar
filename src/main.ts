import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { initOneSignal } from './lib/onesignal';

const app = mount(App, {
  target: document.getElementById('app')!,
});

// Detect language from URL param first, then fall back to browser language.
// Used to tag the subscriber so they land in the correct OneSignal segment.
function detectLang(): 'en' | 'kr' {
  const urlLang = new URL(window.location.href).searchParams.get('lang');
  if (urlLang === 'kr' || urlLang === 'ko') return 'kr';
  if (urlLang === 'en') return 'en';
  return navigator.language.startsWith('ko') ? 'kr' : 'en';
}

void initOneSignal(detectLang());

export default app;
