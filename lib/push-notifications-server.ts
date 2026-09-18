import { getMessaging } from 'firebase-admin/messaging'
import { getAdminApp, getAdminDb } from '@/lib/firebase-admin'
import { DEFAULT_FCM_SETTINGS, type FCMSettings } from '@/lib/fcm-settings'
import {
  mapNotificationTypeToPreference,
  shouldNotifyUser,
} from '@/lib/user-settings'

export type PushNotificationType =
  | 'community_joined'
  | 'group_joined'
  | 'group_message'
  | 'event_created'
  | 'news_published'
  | 'newsletter'
  | 'job_application'
  | 'marketplace_purchase'
  | 'offer_approved'
  | 'test'

function fcmTypeEnabled(settings: FCMSettings, type: PushNotificationType): boolean {
  if (settings.enabled === false) return false
  switch (type) {
    case 'community_joined':
      return settings.newCommunityNotification !== false
    case 'group_joined':
      return settings.newGroupJoinedNotification !== false
    case 'group_message':
      return settings.newGroupMessageNotification !== false
    case 'event_created':
      return settings.newEventNotification !== false
    case 'news_published':
      return settings.newCommunityNotification !== false
    case 'newsletter':
      return settings.newsletterNotification !== false
    case 'job_application':
    case 'marketplace_purchase':
    case 'offer_approved':
      return settings.businessAlertsNotification !== false
    case 'test':
      return true
    default:
      return true
  }
}

export async function sendPushToUser(
  userId: string,
  notification: { title: string; body: string },
  data: Record<string, string> = {}
): Promise<{ sent: boolean; skipped?: string }> {
  const db = getAdminDb()
  const userSnap = await db.collection('users').doc(userId).get()
  if (!userSnap.exists) {
    return { sent: false, skipped: 'User not found' }
  }

  const userData = userSnap.data() || {}
  const token = userData.fcmToken
  if (typeof token !== 'string' || token.length < 10) {
    return { sent: false, skipped: 'No FCM token' }
  }

  const type = (data.type || 'test') as PushNotificationType
  const fcmSettings: FCMSettings = {
    ...DEFAULT_FCM_SETTINGS,
    ...(userData.fcmSettings || {}),
  }

  if (!fcmTypeEnabled(fcmSettings, type)) {
    return { sent: false, skipped: 'FCM type disabled' }
  }

  const prefKey = mapNotificationTypeToPreference(type)
  if (!shouldNotifyUser({ ...userData, id: userId }, 'push', prefKey)) {
    return { sent: false, skipped: 'Push disabled in preferences' }
  }

  try {
    const messaging = getMessaging(getAdminApp())
    await messaging.send({
      token,
      notification,
      data: { ...data, click_action: data.click_action || '/' },
    })
    return { sent: true }
  } catch (error) {
    console.error('[push] send failed for', userId, error)
    return { sent: false, skipped: 'FCM send error' }
  }
}

export async function sendPushToUsers(
  userIds: string[],
  notification: { title: string; body: string },
  data: Record<string, string> = {}
): Promise<{ sent: number; skipped: number }> {
  let sent = 0
  let skipped = 0
  const unique = [...new Set(userIds.filter(Boolean))]
  for (const uid of unique) {
    const result = await sendPushToUser(uid, notification, data)
    if (result.sent) sent += 1
    else skipped += 1
  }
  return { sent, skipped }
}

export async function notifyGroupMessage(params: {
  communityId: string
  groupId: string
  senderId: string
  senderName: string
  groupName: string
  preview: string
}) {
  const db = getAdminDb()
  const membersSnap = await db
    .collection('communities')
    .doc(params.communityId)
    .collection('groups')
    .doc(params.groupId)
    .collection('members')
    .where('joinStatus', '==', 'active')
    .get()

  const recipientIds = membersSnap.docs
    .map((d) => d.data().userId as string)
    .filter((uid) => uid && uid !== params.senderId)

  return sendPushToUsers(
    recipientIds,
    {
      title: params.groupName,
      body: `${params.senderName}: ${params.preview.slice(0, 120)}`,
    },
    {
      type: 'group_message',
      communityId: params.communityId,
      groupId: params.groupId,
      click_action: `/communities/${params.communityId}/groups/${params.groupId}`,
    }
  )
}

async function collectMemberUserIds(limit = 2000): Promise<string[]> {
  const db = getAdminDb()
  const ids: string[] = []

  try {
    let snap = await db
      .collection('users')
      .where('fcmToken', '>', '')
      .orderBy('fcmToken')
      .limit(Math.min(300, limit))
      .get()

    while (!snap.empty) {
      for (const docSnap of snap.docs) ids.push(docSnap.id)
      if (ids.length >= limit || snap.size < 300) break
      const last = snap.docs[snap.docs.length - 1]
      snap = await db
        .collection('users')
        .where('fcmToken', '>', '')
        .orderBy('fcmToken')
        .startAfter(last)
        .limit(Math.min(300, limit - ids.length))
        .get()
    }
  } catch (error) {
    console.warn('[push] token query failed, falling back to user scan:', error)
  }

  if (ids.length === 0) {
    const snap = await db.collection('users').limit(Math.min(500, limit)).get()
    return snap.docs.map((d) => d.id)
  }

  return ids
}

export async function notifyNewEventPublished(eventTitle: string, eventId: string) {
  const userIds = await collectMemberUserIds()
  return sendPushToUsers(
    userIds,
    {
      title: 'New community event',
      body: eventTitle,
    },
    {
      type: 'event_created',
      eventId,
      click_action: `/events/${eventId}`,
    }
  )
}

export async function notifyNewsPublished(params: {
  title: string
  newsId: string
  slug?: string
  summary?: string
}) {
  const userIds = await collectMemberUserIds()
  const path = params.slug
    ? `/news/${encodeURIComponent(params.slug)}`
    : `/news/${params.newsId}`
  return sendPushToUsers(
    userIds,
    {
      title: 'New from Passive Blessings',
      body: params.summary?.trim() || params.title,
    },
    {
      type: 'news_published',
      newsId: params.newsId,
      click_action: path,
    }
  )
}

export async function notifyNewsletterPublished(subject: string, userIds: string[]) {
  return sendPushToUsers(
    userIds,
    {
      title: 'Passive Blessings newsletter',
      body: subject,
    },
    {
      type: 'newsletter',
      click_action: '/dashboard/settings',
    }
  )
}

export async function notifyCommunityMembers(params: {
  communityId: string
  excludeUserId?: string
  title: string
  body: string
  type: PushNotificationType
  clickAction?: string
}) {
  const db = getAdminDb()
  const membersSnap = await db
    .collection('communities')
    .doc(params.communityId)
    .collection('members')
    .get()

  const recipientIds = membersSnap.docs
    .map((d) => d.data().userId as string)
    .filter((uid) => uid && uid !== params.excludeUserId)

  return sendPushToUsers(
    recipientIds,
    { title: params.title, body: params.body },
    {
      type: params.type,
      communityId: params.communityId,
      click_action: params.clickAction || `/communities/${params.communityId}`,
    }
  )
}
