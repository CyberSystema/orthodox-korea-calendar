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

function buildEventUrl(data) {
  if (!data || typeof data !== 'object') return '/';

  const eventId = data.eventId || data.event_id || data.id;
  const eventDate = data.date || data.eventDate || data.event_date;

  if (typeof data.url === 'string' && data.url.trim()) {
    return data.url;
  }

  if (typeof eventId === 'string' && eventId) {
    const params = new URLSearchParams({ event: eventId });
    if (typeof eventDate === 'string' && eventDate) {
      params.set('date', eventDate);
    }
    return `/?${params.toString()}`;
  }

  return '/';
}

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Orthodox Korea';
  const clickUrl = buildEventUrl(payload.data || {});
  const options = {
    body: payload.notification?.body || '',
    data: {
      ...(payload.data || {}),
      clickUrl,
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = (event.notification?.data && event.notification.data.clickUrl) || '/';

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
