import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'

let db: any

function getAdminDb() {
  if (db) return db
  
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  })
  
  db = getAdminFirestore(app)
  return db
}

// GET - Fetch groups
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')
    const communityId = searchParams.get('communityId')
    const userId = searchParams.get('userId')

    // Get single group
    if (groupId) {
      const doc = await db.collection('community-groups').doc(groupId).get()
      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: { id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.(), updatedAt: doc.data().updatedAt?.toDate?.() },
      })
    }

    // Get groups in community
    if (communityId) {
      const snapshot = await db.collection('community-groups')
        .where('communityId', '==', communityId)
        .where('status', '==', 'active')
        .get()

      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
      }))

      return NextResponse.json({ success: true, data: groups })
    }

    // Get user's groups
    if (userId) {
      const memberQuery = await db.collection('community-group-members')
        .where('userId', '==', userId)
        .get()

      const groupIds = memberQuery.docs.map(d => d.data().groupId)
      if (groupIds.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      const groups = []
      for (const gId of groupIds) {
        const groupDoc = await db.collection('community-groups').doc(gId).get()
        if (groupDoc.exists && groupDoc.data().status === 'active') {
          groups.push({
            id: groupDoc.id,
            ...groupDoc.data(),
            createdAt: groupDoc.data().createdAt?.toDate?.(),
            updatedAt: groupDoc.data().updatedAt?.toDate?.(),
          })
        }
      }
      return NextResponse.json({ success: true, data: groups })
    }

    return NextResponse.json({ success: false, error: 'Missing query parameters' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Error fetching groups:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST - Create group
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { communityId, name, description, createdBy, tags, visibility, rules } = body

    if (!communityId || !name || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'communityId, name, and createdBy are required' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating group:', { name, communityId })

    const groupRef = await db.collection('community-groups').add({
      communityId,
      name,
      description: description || '',
      tags: tags || [],
      status: 'active',
      visibility: visibility || 'public',
      createdBy,
      moderators: [createdBy],
      members: {
        total: 1,
      },
      rules: rules || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Add creator as member
    await db.collection('community-group-members').add({
      userId: createdBy,
      groupId: groupRef.id,
      communityId,
      role: 'moderator',
      joinedAt: new Date(),
    })

    console.log('[v0] Group created:', groupRef.id)

    return NextResponse.json({
      success: true,
      data: {
        id: groupRef.id,
        name,
        communityId,
      },
    })
  } catch (error) {
    console.error('[v0] Error creating group:', error)
    return NextResponse.json({ success: false, error: 'Failed to create group' }, { status: 500 })
  }
}

// PUT - Update group
export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { groupId, ...updateData } = body

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'groupId is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Updating group:', groupId)

    await db.collection('community-groups').doc(groupId).update({
      ...updateData,
      updatedAt: new Date(),
    })

    console.log('[v0] Group updated successfully')

    return NextResponse.json({ success: true, message: 'Group updated' })
  } catch (error) {
    console.error('[v0] Error updating group:', error)
    return NextResponse.json({ success: false, error: 'Failed to update group' }, { status: 500 })
  }
}

// DELETE - Archive group
export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Archiving group:', groupId)

    await db.collection('community-groups').doc(groupId).update({
      status: 'archived',
      updatedAt: new Date(),
    })

    console.log('[v0] Group archived successfully')

    return NextResponse.json({ success: true, message: 'Group archived' })
  } catch (error) {
    console.error('[v0] Error archiving group:', error)
    return NextResponse.json({ success: false, error: 'Failed to archive group' }, { status: 500 })
  }
}
