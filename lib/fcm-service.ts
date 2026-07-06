import { db } from './firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

export interface FCMSettings {
  enabled: boolean
  newCommunityNotification: boolean
  newGroupMessageNotification: boolean
  newEventNotification: boolean
  newsletterNotification: boolean
  newGroupJoinedNotification: boolean
}

export const DEFAULT_FCM_SETTINGS: FCMSettings = {
  enabled: true,
  newCommunityNotification: true,
  newGroupMessageNotification: true,
  newEventNotification: true,
  newsletterNotification: true,
  newGroupJoinedNotification: true,
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!('Notification' in window)) {
      console.log('[v0] This browser does not support notifications')
      return null
    }

    if (Notification.permission === 'granted') {
      console.log('[v0] Notification permission already granted')
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        console.log('[v0] Notification permission granted')
        return 'granted'
      }
    }

    return null
  } catch (error) {
    console.error('[v0] Error requesting notification permission:', error)
    return null
  }
}

export async function storeFCMToken(userId: string, token: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token,
      fcmSettings: DEFAULT_FCM_SETTINGS,
      fcmUpdatedAt: new Date(),
    })
    console.log('[v0] FCM token stored for user:', userId)
  } catch (error) {
    console.error('[v0] Error storing FCM token:', error)
  }
}

export async function getUserFCMSettings(userId: string): Promise<FCMSettings> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return userDoc.data()?.fcmSettings || DEFAULT_FCM_SETTINGS
    }
    return DEFAULT_FCM_SETTINGS
  } catch (error) {
    console.error('[v0] Error getting FCM settings:', error)
    return DEFAULT_FCM_SETTINGS
  }
}

export async function updateFCMSettings(userId: string, settings: Partial<FCMSettings>): Promise<void> {
  try {
    const currentSettings = await getUserFCMSettings(userId)
    await updateDoc(doc(db, 'users', userId), {
      fcmSettings: { ...currentSettings, ...settings },
    })
    console.log('[v0] FCM settings updated for user:', userId)
  } catch (error) {
    console.error('[v0] Error updating FCM settings:', error)
  }
}

export async function sendNotification(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
  try {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        notification: {
          title,
          body,
        },
        data: data || {},
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to send notification')
    }

    console.log('[v0] Notification sent to user:', userId)
  } catch (error) {
    console.error('[v0] Error sending notification:', error)
  }
}
