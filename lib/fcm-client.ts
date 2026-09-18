'use client'

import { getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { storeFCMToken } from '@/lib/fcm-service'
import { registerPbServiceWorker } from '@/components/pwa-provider'

let cachedVapidKey: string | null | undefined

async function resolveVapidKey(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()
  if (fromEnv) return fromEnv

  if (cachedVapidKey !== undefined) return cachedVapidKey

  try {
    const res = await fetch('/api/public/web-push-config', { cache: 'no-store' })
    if (!res.ok) {
      cachedVapidKey = null
      return null
    }
    const data = (await res.json()) as { vapidKey?: string | null }
    cachedVapidKey = typeof data.vapidKey === 'string' && data.vapidKey.trim() ? data.vapidKey.trim() : null
    return cachedVapidKey
  } catch (error) {
    console.warn('[fcm] Failed to load VAPID key:', error)
    cachedVapidKey = null
    return null
  }
}

/** Register FCM token after login when permission is already granted. */
export async function registerFCMTokenIfPossible(userId: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const supported = await isSupported()
    if (!supported) return

    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const vapidKey = await resolveVapidKey()
    if (!vapidKey) {
      console.warn('[fcm] VAPID key not configured — skipping token registration')
      return
    }

    const app = getApps()[0]
    if (!app) return

    const registration = await registerPbServiceWorker()
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey,
      ...(registration ? { serviceWorkerRegistration: registration } : {}),
    })
    if (!token) return

    await storeFCMToken(userId, token)
  } catch (error) {
    console.warn('[fcm] Token registration failed:', error)
  }
}

/** Request permission then register token. */
export async function requestAndRegisterFCM(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') return false

  await registerFCMTokenIfPossible(userId)
  return true
}
