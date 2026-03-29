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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Orthodox Korea';
  const options = {
    body: payload.notification?.body || '',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});
