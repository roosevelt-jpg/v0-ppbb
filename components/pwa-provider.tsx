'use client'

import { useEffect } from 'react'
import { getApps } from 'firebase/app'
import { getMessaging, isSupported, onMessage } from 'firebase/messaging'

const SW_URL = '/firebase-messaging-sw.js'

export type PbBeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __pbDeferredInstallPrompt?: PbBeforeInstallPromptEvent | null
    __pbInstallPromptReady?: boolean
  }
}

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

function captureInstallPrompt(e: Event) {
  e.preventDefault()
  const bip = e as PbBeforeInstallPromptEvent
  window.__pbDeferredInstallPrompt = bip
  window.dispatchEvent(new CustomEvent('pb-install-prompt-ready', { detail: bip }))
}

/**
 * Capture beforeinstallprompt as early as possible (before React children hydrate).
 * Call once from PwaProvider.
 */
export function armInstallPromptCapture() {
  if (typeof window === 'undefined') return
  if (window.__pbInstallPromptReady) return
  window.__pbInstallPromptReady = true
  // Head script may already have captured; keep listening for later fires
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
  if (window.__pbDeferredInstallPrompt) {
    window.dispatchEvent(
      new CustomEvent('pb-install-prompt-ready', { detail: window.__pbDeferredInstallPrompt })
    )
  }
}

// Capture as soon as this module evaluates on the client (before React effects)
if (typeof window !== 'undefined') {
  armInstallPromptCapture()
}

export function getDeferredInstallPrompt(): PbBeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') return null
  return window.__pbDeferredInstallPrompt || null
}

export function clearDeferredInstallPrompt() {
  if (typeof window === 'undefined') return
  window.__pbDeferredInstallPrompt = null
}

/** Mounts SW registration + foreground FCM + early install-prompt capture. */
export function PwaProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    armInstallPromptCapture()
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
