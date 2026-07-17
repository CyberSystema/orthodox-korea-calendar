importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const query = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: query.get('apiKey') || '',
  authDomain: query.get('authDomain') || '',
  projectId: query.get('projectId') || '',
  storageBucket: query.get('storageBucket') || '',
  messagingSenderId: query.get('messagingSenderId') || '',
  appId: query.get('appId') || '',
});

const messaging = firebase.messaging();
const APP_LINK_ORIGIN = 'https://orthodox-korea-calendar.pages.dev';

function buildAppLink(pathAndQuery) {
  return new URL(pathAndQuery, APP_LINK_ORIGIN).toString();
}

function normalizeNotificationUrl(url) {
  if (typeof url !== 'string') return '/';

  const trimmed = url.trim();
  if (!trimmed) return '/';

  if (trimmed.startsWith('okncalendar://') || trimmed.startsWith('orthodoxkorea://')) {
    const normalized = trimmed.replace(/^orthodoxkorea:\/\//, 'okncalendar://');

    if (normalized === 'okncalendar://today') {
      return buildAppLink('/?view=today');
    }

    const match = normalized.match(/^okncalendar:\/\/event\/([^?]+)(?:\?(.*))?$/);
    if (!match) {
      return '/';
    }

    const eventId = decodeURIComponent(match[1]);
    const query = new URLSearchParams(match[2] || '');
    const date = query.get('date') || query.get('dateISO');
    const webParams = new URLSearchParams({ event: eventId });
    if (date) {
      webParams.set('date', date);
    }
    return buildAppLink(`/?${webParams.toString()}`);
  }

  return trimmed;
}

function buildEventUrl(data) {
  if (!data || typeof data !== 'object') return '/';

  const eventId = data.eventId || data.event_id || data.id;
  const eventDate = data.date || data.eventDate || data.event_date;

  if (typeof data.url === 'string' && data.url.trim()) {
    return normalizeNotificationUrl(data.url);
  }

  if (typeof eventId === 'string' && eventId) {
    const params = new URLSearchParams({ event: eventId });
    if (typeof eventDate === 'string' && eventDate) {
      params.set('date', eventDate);
    }
    return buildAppLink(`/?${params.toString()}`);
  }

  return buildAppLink('/');
}

messaging.onBackgroundMessage((payload) => {
  // Web pushes are sent data-only (title/body live in `data`) so this handler renders
  // exactly one notification; fall back to the notification block for safety.
  const data = payload.data || {};
  const title = data.title || payload.notification?.title || 'Orthodox Korea';
  const clickUrl = buildEventUrl(data);
  const options = {
    body: data.body || payload.notification?.body || '',
    data: {
      ...data,
      clickUrl,
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = (event.notification?.data && event.notification.data.clickUrl) || buildAppLink('/');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(clickUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }

      return undefined;
    }),
  );
});
