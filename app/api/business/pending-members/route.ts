import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { hasBusinessAccessServer, hasAdminAccessServer } from '@/lib/roles-server'

export type PendingMemberRow = {
  id: string
  communityId: string
  communityName: string
  groupId: string
  groupName: string
  userId: string
  displayName?: string
  email?: string
  joinedAt?: unknown
  joinStatus: string
}

/**
 * GET — pending join requests for groups owned by the authenticated business user.
 * Ownership: group.createdBy === uid (admins see all pending across platform).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const userData = userSnap.data() || {}
    if (!hasBusinessAccessServer(userData) && !hasAdminAccessServer(userData)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const isAdmin = hasAdminAccessServer(userData)
    const rows: PendingMemberRow[] = []

    // Prefer communities owned by this business
    let communitiesQuery = db.collection('communities').where('businessId', '==', uid).limit(50)
    if (isAdmin && request.nextUrl.searchParams.get('all') === '1') {
      communitiesQuery = db.collection('communities').limit(100)
    }

    const communitiesSnap = await communitiesQuery.get()

    for (const communityDoc of communitiesSnap.docs) {
      const communityData = communityDoc.data()
      const communityName = (communityData.name as string) || 'Community'
      const groupsSnap = await communityDoc.ref.collection('groups').get()

      for (const groupDoc of groupsSnap.docs) {
        const groupData = groupDoc.data()
        const createdBy = groupData.createdBy as string
        if (!isAdmin && createdBy !== uid) continue

        const membersSnap = await groupDoc.ref
          .collection('members')
          .where('joinStatus', '==', 'pending')
          .get()

        for (const memberDoc of membersSnap.docs) {
          const m = memberDoc.data()
          rows.push({
            id: memberDoc.id,
            communityId: communityDoc.id,
            communityName,
            groupId: groupDoc.id,
            groupName: (groupData.name as string) || 'Group',
            userId: (m.userId as string) || '',
            displayName: (m.displayName as string) || (m.name as string) || undefined,
            email: (m.email as string) || undefined,
            joinedAt: m.joinedAt || m.createdAt,
            joinStatus: 'pending',
          })
        }
      }
    }

    // Also cover groups where createdBy == uid but community.businessId differs
    if (!isAdmin) {
      try {
        const ownedGroups = await db
          .collectionGroup('groups')
          .where('createdBy', '==', uid)
          .limit(100)
          .get()

        for (const groupDoc of ownedGroups.docs) {
          const pathParts = groupDoc.ref.path.split('/')
          // communities/{id}/groups/{id}
          if (pathParts.length < 4 || pathParts[0] !== 'communities') continue
          const communityId = pathParts[1]
          if (rows.some((r) => r.groupId === groupDoc.id && r.communityId === communityId)) {
            continue
          }

          const communitySnap = await db.collection('communities').doc(communityId).get()
          const communityName =
            (communitySnap.data()?.name as string) || 'Community'
          const groupData = groupDoc.data()

          const membersSnap = await groupDoc.ref
            .collection('members')
            .where('joinStatus', '==', 'pending')
            .get()

          for (const memberDoc of membersSnap.docs) {
            const m = memberDoc.data()
            rows.push({
              id: memberDoc.id,
              communityId,
              communityName,
              groupId: groupDoc.id,
              groupName: (groupData.name as string) || 'Group',
              userId: (m.userId as string) || '',
              displayName: (m.displayName as string) || (m.name as string) || undefined,
              email: (m.email as string) || undefined,
              joinedAt: m.joinedAt || m.createdAt,
              joinStatus: 'pending',
            })
          }
        }
      } catch (cgError) {
        // collectionGroup may need an index; communities query above still works
        console.warn('[v0] collectionGroup groups query skipped:', cgError)
      }
    }

    return NextResponse.json({
      success: true,
      data: rows.map((r) =>
        serializeFirestoreDoc(r.id, r as unknown as Record<string, unknown>)
      ),
      count: rows.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching pending members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending members' },
      { status: 500 }
    )
  }
}
