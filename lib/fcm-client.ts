'use client'

import { getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { auth } from '@/lib/firebase'
import { storeFCMToken } from '@/lib/fcm-service'

/** Register FCM token after login when permission is granted. */
export async function registerFCMTokenIfPossible(userId: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const supported = await isSupported()
    if (!supported) return

    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.warn('[fcm] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — skipping token registration')
      return
    }

    const app = getApps()[0]
    if (!app) return

    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey })
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
