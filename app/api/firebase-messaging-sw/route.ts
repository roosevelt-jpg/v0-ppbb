import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Combined service worker (PWA installability + FCM background push).
 * Exposed at /firebase-messaging-sw.js via next.config rewrite.
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  }

  const body = `/* Passive Blessings PWA + FCM service worker */
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

const FIREBASE_CONFIG = ${JSON.stringify(config)};

try {
  firebase.initializeApp(FIREBASE_CONFIG);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    const title =
      (payload.notification && payload.notification.title) ||
      (payload.data && payload.data.title) ||
      'Passive Blessings';
    const options = {
      body:
        (payload.notification && payload.notification.body) ||
        (payload.data && payload.data.body) ||
        '',
      icon: '/api/pwa-icon?size=192',
      badge: '/api/pwa-icon?size=192',
      data: payload.data || {},
      tag: (payload.data && (payload.data.type || payload.data.eventId || payload.data.newsId)) || 'pb-push',
    };
    return self.registration.showNotification(title, options);
  });
} catch (err) {
  console.warn('[pb-sw] FCM init skipped:', err);
}

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = '/';
  try {
    if (event.notification && event.notification.data && event.notification.data.click_action) {
      target = event.notification.data.click_action;
    }
  } catch (e) {}
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    })
  );
});
`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
