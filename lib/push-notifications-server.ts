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
  | 'group_join_approved'
  | 'group_join_rejected'
  | 'event_created'
  | 'event_reminder'
  | 'event_registration'
  | 'news_published'
  | 'newsletter'
  | 'job_published'
  | 'job_application'
  | 'job_approved'
  | 'offer_published'
  | 'offer_approved'
  | 'discount_published'
  | 'marketplace_purchase'
  | 'membership'
  | 'donation'
  | 'approval_outcome'
  | 'admin_alert'
  | 'system_alert'
  | 'test'

function fcmTypeEnabled(settings: FCMSettings, type: PushNotificationType): boolean {
  if (settings.enabled === false) return false
  switch (type) {
    case 'community_joined':
    case 'news_published':
    case 'job_published':
    case 'offer_published':
    case 'discount_published':
      return settings.newCommunityNotification !== false
    case 'group_joined':
    case 'group_join_approved':
    case 'group_join_rejected':
      return settings.newGroupJoinedNotification !== false
    case 'group_message':
      return settings.newGroupMessageNotification !== false
    case 'event_created':
    case 'event_reminder':
    case 'event_registration':
      return settings.newEventNotification !== false
    case 'newsletter':
      return settings.newsletterNotification !== false
    case 'job_application':
    case 'job_approved':
    case 'marketplace_purchase':
    case 'offer_approved':
    case 'membership':
    case 'donation':
    case 'approval_outcome':
    case 'admin_alert':
    case 'system_alert':
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

  const type = (data.type || 'system_alert') as PushNotificationType
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

/** Fire-and-forget wrapper — never throws to callers. */
export function pushToUserSafe(
  userId: string | undefined | null,
  notification: { title: string; body: string },
  data: Record<string, string> = {}
): void {
  const uid = String(userId || '').trim()
  if (!uid) return
  void sendPushToUser(uid, notification, data).catch((err) =>
    console.warn('[push] pushToUserSafe failed:', err)
  )
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

async function collectAdminUserIds(): Promise<string[]> {
  const db = getAdminDb()
  const ids = new Set<string>()
  try {
    const [admins, supers] = await Promise.all([
      db.collection('users').where('role', '==', 'admin').limit(200).get(),
      db.collection('users').where('role', '==', 'super_admin').limit(50).get(),
    ])
    for (const d of admins.docs) ids.add(d.id)
    for (const d of supers.docs) ids.add(d.id)
  } catch (error) {
    console.warn('[push] admin query failed:', error)
  }

  // Also include token holders who have roles array containing admin
  try {
    const rolesSnap = await db
      .collection('users')
      .where('roles', 'array-contains', 'admin')
      .limit(100)
      .get()
    for (const d of rolesSnap.docs) ids.add(d.id)
  } catch {
    /* index may be missing — ignore */
  }

  return [...ids]
}

/** Broadcast to every subscribed member with an FCM token. */
export async function notifyAllSubscribers(
  notification: { title: string; body: string },
  data: Record<string, string>
): Promise<{ sent: number; skipped: number }> {
  const userIds = await collectMemberUserIds()
  return sendPushToUsers(userIds, notification, data)
}

export function notifyAllSubscribersSafe(
  notification: { title: string; body: string },
  data: Record<string, string>
): void {
  void notifyAllSubscribers(notification, data).catch((err) =>
    console.warn('[push] notifyAllSubscribersSafe failed:', err)
  )
}

export async function notifyAdminsPush(
  notification: { title: string; body: string },
  data: Record<string, string> = {}
): Promise<{ sent: number; skipped: number }> {
  const adminIds = await collectAdminUserIds()
  return sendPushToUsers(adminIds, notification, {
    type: 'admin_alert',
    ...data,
  })
}

export function notifyAdminsPushSafe(
  notification: { title: string; body: string },
  data: Record<string, string> = {}
): void {
  void notifyAdminsPush(notification, data).catch((err) =>
    console.warn('[push] notifyAdminsPushSafe failed:', err)
  )
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

export async function notifyNewEventPublished(eventTitle: string, eventId: string) {
  return notifyAllSubscribers(
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
  const path = params.slug
    ? `/news/${encodeURIComponent(params.slug)}`
    : `/news/${params.newsId}`
  return notifyAllSubscribers(
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

export async function notifyOpportunityPublished(params: {
  title: string
  jobId: string
  businessId?: string
  /** Default true. Set false when the owner already got a personal push. */
  notifyOwner?: boolean
}) {
  if (params.businessId && params.notifyOwner !== false) {
    pushToUserSafe(
      params.businessId,
      { title: 'Listing published', body: `Your listing ${params.title} is now live.` },
      {
        type: 'job_approved',
        jobId: params.jobId,
        click_action: '/business/opportunities',
      }
    )
  }
  return notifyAllSubscribers(
    {
      title: 'New opportunity',
      body: params.title,
    },
    {
      type: 'job_published',
      jobId: params.jobId,
      click_action: `/opportunities/${params.jobId}`,
    }
  )
}

export async function notifyOfferPublished(params: {
  title: string
  offerId: string
  businessId?: string
  notifyOwner?: boolean
}) {
  if (params.businessId && params.notifyOwner !== false) {
    pushToUserSafe(
      params.businessId,
      { title: 'Offer published', body: `Your offer "${params.title}" is now live.` },
      {
        type: 'offer_approved',
        offerId: params.offerId,
        click_action: '/business/offers',
      }
    )
  }
  return notifyAllSubscribers(
    {
      title: 'New marketplace offer',
      body: params.title,
    },
    {
      type: 'offer_published',
      offerId: params.offerId,
      click_action: `/marketplace`,
    }
  )
}

export async function notifyDiscountPublished(params: {
  title: string
  discountId: string
  businessId?: string
  notifyOwner?: boolean
}) {
  if (params.businessId && params.notifyOwner !== false) {
    pushToUserSafe(
      params.businessId,
      { title: 'Discount published', body: `Your discount "${params.title}" is now live.` },
      {
        type: 'discount_published',
        discountId: params.discountId,
        click_action: '/business/discounts',
      }
    )
  }
  return notifyAllSubscribers(
    {
      title: 'New member discount',
      body: params.title,
    },
    {
      type: 'discount_published',
      discountId: params.discountId,
      click_action: '/marketplace',
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
