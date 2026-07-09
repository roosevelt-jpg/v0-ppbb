'use client'

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { auth } from '@/lib/firebase'

export interface DmThread {
  id: string
  participantIds: string[]
  participantNames: Record<string, string>
  lastMessage: string
  lastMessageAt: Date
  lastSenderId: string
  unreadCounts: Record<string, number>
  createdAt: Date
}

export interface DmMessage {
  id: string
  senderId: string
  content: string
  createdAt: Date
  readBy: string[]
}

export function buildDmThreadId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_')
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function getOrCreateDmThread(
  currentUserId: string,
  recipientId: string,
  currentUserName: string,
  recipientName: string
): Promise<string> {
  const threadId = buildDmThreadId(currentUserId, recipientId)
  const ref = doc(db, 'dmThreads', threadId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      participantIds: [currentUserId, recipientId],
      participantNames: {
        [currentUserId]: currentUserName,
        [recipientId]: recipientName,
      },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastSenderId: '',
      unreadCounts: {
        [currentUserId]: 0,
        [recipientId]: 0,
      },
      createdAt: serverTimestamp(),
    })
  }

  return threadId
}

export function subscribeToUserDmThreads(
  userId: string,
  callback: (threads: DmThread[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'dmThreads'),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  )

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            participantIds: (data.participantIds as string[]) || [],
            participantNames: (data.participantNames as Record<string, string>) || {},
            lastMessage: String(data.lastMessage || ''),
            lastMessageAt:
              data.lastMessageAt && typeof data.lastMessageAt.toDate === 'function'
                ? data.lastMessageAt.toDate()
                : new Date(),
            lastSenderId: String(data.lastSenderId || ''),
            unreadCounts: (data.unreadCounts as Record<string, number>) || {},
            createdAt:
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : new Date(),
          }
        })
      )
    },
    () => callback([])
  )
}

export function subscribeToDmMessages(
  threadId: string,
  callback: (messages: DmMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'dmThreads', threadId, 'messages'),
    orderBy('createdAt', 'asc')
  )

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            senderId: String(data.senderId || ''),
            content: String(data.content || ''),
            createdAt:
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : new Date(),
            readBy: Array.isArray(data.readBy) ? (data.readBy as string[]) : [],
          }
        })
      )
    },
    () => callback([])
  )
}

export async function sendDmMessage(params: {
  threadId: string
  senderId: string
  recipientId: string
  content: string
  senderName: string
}): Promise<void> {
  const preview = stripHtml(params.content).slice(0, 180)
  const threadRef = doc(db, 'dmThreads', params.threadId)

  await addDoc(collection(db, 'dmThreads', params.threadId, 'messages'), {
    senderId: params.senderId,
    content: params.content,
    readBy: [params.senderId],
    createdAt: serverTimestamp(),
  })

  const threadSnap = await getDoc(threadRef)
  const unread = (threadSnap.data()?.unreadCounts as Record<string, number>) || {}

  await updateDoc(threadRef, {
    lastMessage: preview,
    lastMessageAt: serverTimestamp(),
    lastSenderId: params.senderId,
    [`unreadCounts.${params.recipientId}`]: (unread[params.recipientId] || 0) + 1,
    [`participantNames.${params.senderId}`]: params.senderName,
  })

  void (async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch('/api/dm/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipientId: params.recipientId,
          senderId: params.senderId,
          senderName: params.senderName,
          preview,
          threadId: params.threadId,
        }),
      })
    } catch {
      /* non-blocking */
    }
  })()
}

export async function markDmThreadRead(threadId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'dmThreads', threadId), {
    [`unreadCounts.${userId}`]: 0,
  })
}

export async function resolveUserDisplayName(userId: string): Promise<string> {
  const snap = await getDoc(doc(db, 'users', userId))
  if (!snap.exists()) return 'Member'
  const data = snap.data()
  const name =
    `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
    String(data.displayName || data.businessProfile?.businessName || 'Member')
  return name
}
