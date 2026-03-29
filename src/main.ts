import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { initFcm } from './lib/fcm';

const app = mount(App, {
  target: document.getElementById('app')!,
});

// Detect language from URL param first, then fall back to browser language.
// Used to tag push subscriptions for localized delivery.
function detectLang(): 'en' | 'kr' {
  const urlLang = new URL(window.location.href).searchParams.get('lang');
  if (urlLang === 'kr' || urlLang === 'ko') return 'kr';
  if (urlLang === 'en') return 'en';
  return navigator.language.startsWith('ko') ? 'kr' : 'en';
}

void initFcm(detectLang());

export default app;
