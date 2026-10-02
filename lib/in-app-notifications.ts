import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'

export type InAppNotificationInput = {
  title: string
  message: string
  href?: string
  type?: string
}

export async function addUserNotification(
  userId: string,
  input: InAppNotificationInput
): Promise<void> {
  const uid = userId.trim()
  if (!uid) return
  await getAdminDb()
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .add({
      title: input.title.slice(0, 180),
      message: input.message.slice(0, 500),
      href: input.href || '/dashboard',
      type: input.type || 'system_alert',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })
}

export async function addAdminAlert(input: InAppNotificationInput): Promise<void> {
  await getAdminDb().collection('adminNotifications').add({
    title: input.title.slice(0, 180),
    message: input.message.slice(0, 500),
    body: input.message.slice(0, 500),
    href: input.href || '/admin',
    type: input.type || 'admin_alert',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  })
}

/** One in-app row per member so the notification bell can show event alerts. */
export async function notifyMembersInApp(input: InAppNotificationInput): Promise<number> {
  const db = getAdminDb()
  const snap = await db.collection('users').limit(800).get()
  let batch = db.batch()
  let pending = 0
  let written = 0

  for (const userDoc of snap.docs) {
    const data = userDoc.data() || {}
    if (data.accountDeleted === true || data.deleted === true || data.status === 'deleted' || data.active === false) continue
    const ref = userDoc.ref.collection('notifications').doc()
    batch.set(ref, {
      title: input.title.slice(0, 180),
      message: input.message.slice(0, 500),
      href: input.href || '/events',
      type: input.type || 'event_created',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })
    pending++
    written++
    if (pending >= 400) {
      await batch.commit()
      batch = db.batch()
      pending = 0
    }
  }

  if (pending > 0) await batch.commit()
  return written
}
