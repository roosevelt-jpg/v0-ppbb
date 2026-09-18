'use client'

import { useEffect } from 'react'
import { getApps } from 'firebase/app'
import { getMessaging, isSupported, onMessage } from 'firebase/messaging'

const SW_URL = '/firebase-messaging-sw.js'

/** Register the PWA/FCM service worker once on the client. */
export async function registerPbServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const existing = await navigator.serviceWorker.getRegistration('/')
    if (existing?.active?.scriptURL?.includes('firebase-messaging-sw')) {
      return existing
    }
    return await navigator.serviceWorker.register(SW_URL, { scope: '/' })
  } catch (error) {
    console.warn('[pwa] Service worker registration failed:', error)
    return null
  }
}

/** Mounts SW registration + foreground FCM toast-style notifications. */
export function PwaProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    let unsub: (() => void) | undefined

    void (async () => {
      const registration = await registerPbServiceWorker()
      if (!registration) return

      try {
        const supported = await isSupported()
        if (!supported) return
        const app = getApps()[0]
        if (!app) return
        const messaging = getMessaging(app)
        unsub = onMessage(messaging, (payload) => {
          const title = payload.notification?.title || payload.data?.title || 'Passive Blessings'
          const body = payload.notification?.body || payload.data?.body || ''
          if (Notification.permission === 'granted' && title) {
            void registration.showNotification(title, {
              body,
              icon: '/api/pwa-icon?size=192',
              data: payload.data || {},
            })
          }
        })
      } catch (error) {
        console.warn('[pwa] Foreground messaging unavailable:', error)
      }
    })()

    return () => {
      unsub?.()
    }
  }, [])

  return children ? <>{children}</> : null
}
