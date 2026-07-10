'use client'

import { auth } from '@/lib/firebase'

export type CommunityEventType =
  | 'community_joined'
  | 'group_joined'
  | 'group_message'

export async function triggerCommunityNotification(payload: {
  type: CommunityEventType
  communityId: string
  groupId?: string
  groupName?: string
  communityName?: string
  preview?: string
}): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) return
    const token = await user.getIdToken()
    await fetch('/api/notifications/community-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.warn('[community-notify]', error)
  }
}
