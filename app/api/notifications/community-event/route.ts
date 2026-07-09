import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  notifyCommunityMembers,
  notifyGroupMessage,
  sendPushToUser,
} from '@/lib/push-notifications-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, communityId, groupId, groupName, communityName, preview } = body as {
      type?: string
      communityId?: string
      groupId?: string
      groupName?: string
      communityName?: string
      preview?: string
    }

    if (!type || !communityId) {
      return NextResponse.json({ success: false, error: 'type and communityId required' }, { status: 400 })
    }

    const db = getAdminDb()

    if (type === 'community_joined') {
      const name = communityName || 'the community'
      await sendPushToUser(
        uid,
        {
          title: 'Welcome to the community!',
          body: `You joined ${name}. Explore groups and start chatting.`,
        },
        {
          type: 'community_joined',
          communityId,
          click_action: `/communities/${communityId}`,
        }
      )
      return NextResponse.json({ success: true })
    }

    if (type === 'group_joined') {
      const gName = groupName || 'a group'
      const cName = communityName || 'your community'

      await sendPushToUser(
        uid,
        {
          title: 'Welcome to the group!',
          body: `You joined ${gName} in ${cName}.`,
        },
        {
          type: 'group_joined',
          communityId,
          groupId: groupId || '',
          click_action: groupId
            ? `/communities/${communityId}/groups/${groupId}`
            : `/communities/${communityId}`,
        }
      )

      if (groupId) {
        const groupSnap = await db
          .collection('communities')
          .doc(communityId)
          .collection('groups')
          .doc(groupId)
          .get()
        const createdBy = groupSnap.data()?.createdBy
        if (createdBy && createdBy !== uid) {
          const userSnap = await db.collection('users').doc(uid).get()
          const joinerName =
            userSnap.data()?.firstName ||
            userSnap.data()?.displayName ||
            userSnap.data()?.email ||
            'A member'
          await sendPushToUser(
            createdBy,
            {
              title: 'New group member',
              body: `${joinerName} joined ${gName}.`,
            },
            {
              type: 'group_joined',
              communityId,
              groupId,
              click_action: `/communities/${communityId}/groups/${groupId}`,
            }
          )
        }
      }

      return NextResponse.json({ success: true })
    }

    if (type === 'group_message') {
      if (!groupId) {
        return NextResponse.json({ success: false, error: 'groupId required' }, { status: 400 })
      }

      const userSnap = await db.collection('users').doc(uid).get()
      const senderName =
        userSnap.data()?.firstName ||
        userSnap.data()?.displayName ||
        userSnap.data()?.email ||
        'Someone'

      const gName =
        groupName ||
        (await db
          .collection('communities')
          .doc(communityId)
          .collection('groups')
          .doc(groupId)
          .get()
          .then((s) => s.data()?.name)) ||
        'Group'

      const result = await notifyGroupMessage({
        communityId,
        groupId,
        senderId: uid,
        senderName,
        groupName: gName,
        preview: preview || 'New message',
      })

      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json({ success: false, error: 'Unknown event type' }, { status: 400 })
  } catch (error) {
    console.error('[community-event]', error)
    return NextResponse.json({ success: false, error: 'Notification failed' }, { status: 500 })
  }
}
