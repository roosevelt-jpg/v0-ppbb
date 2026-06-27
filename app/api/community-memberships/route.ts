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

// GET - Fetch user's community memberships
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const snapshot = await db.collection('community-memberships')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get()

    const memberships = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toDate?.(),
    }))

    return NextResponse.json({ success: true, data: memberships })
  } catch (error) {
    console.error('[v0] Error fetching memberships:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch memberships' }, { status: 500 })
  }
}

// POST - Join community
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { userId, communityId, role = 'member' } = body

    if (!userId || !communityId) {
      return NextResponse.json(
        { success: false, error: 'userId and communityId are required' },
        { status: 400 }
      )
    }

    console.log('[v0] User joining community:', { userId, communityId })

    // Check if already member
    const existing = await db.collection('community-memberships')
      .where('userId', '==', userId)
      .where('communityId', '==', communityId)
      .get()

    if (!existing.empty) {
      const doc = existing.docs[0]
      if (doc.data().status === 'active') {
        return NextResponse.json(
          { success: false, error: 'Already a member of this community' },
          { status: 400 }
        )
      }
      // Reactivate membership
      await doc.ref.update({ status: 'active', joinedAt: new Date() })
      return NextResponse.json({ success: true, message: 'Rejoined community' })
    }

    // Create membership
    const memberRef = await db.collection('community-memberships').add({
      userId,
      communityId,
      role,
      joinedAt: new Date(),
      status: 'active',
      permissions: ['post_message', 'post_image', 'post_file'],
    })

    // Update community member count
    const communityDoc = await db.collection('communities').doc(communityId).get()
    if (communityDoc.exists) {
      const currentTotal = communityDoc.data().members?.total || 1
      await db.collection('communities').doc(communityId).update({
        'members.total': currentTotal + 1,
        updatedAt: new Date(),
      })
    }

    console.log('[v0] User joined community successfully:', memberRef.id)

    return NextResponse.json({
      success: true,
      data: { id: memberRef.id, communityId, userId },
    })
  } catch (error) {
    console.error('[v0] Error joining community:', error)
    return NextResponse.json({ success: false, error: 'Failed to join community' }, { status: 500 })
  }
}

// PUT - Update membership
export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { membershipId, ...updateData } = body

    if (!membershipId) {
      return NextResponse.json(
        { success: false, error: 'membershipId is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Updating membership:', membershipId)

    await db.collection('community-memberships').doc(membershipId).update(updateData)

    console.log('[v0] Membership updated')

    return NextResponse.json({ success: true, message: 'Membership updated' })
  } catch (error) {
    console.error('[v0] Error updating membership:', error)
    return NextResponse.json({ success: false, error: 'Failed to update membership' }, { status: 500 })
  }
}

// DELETE - Leave community
export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { membershipId, communityId } = body

    if (!membershipId) {
      return NextResponse.json(
        { success: false, error: 'membershipId is required' },
        { status: 400 }
      )
    }

    console.log('[v0] User leaving community')

    await db.collection('community-memberships').doc(membershipId).update({
      status: 'inactive',
      leftAt: new Date(),
    })

    // Update community member count
    if (communityId) {
      const communityDoc = await db.collection('communities').doc(communityId).get()
      if (communityDoc.exists) {
        const currentTotal = Math.max(1, (communityDoc.data().members?.total || 1) - 1)
        await db.collection('communities').doc(communityId).update({
          'members.total': currentTotal,
          updatedAt: new Date(),
        })
      }
    }

    console.log('[v0] User left community')

    return NextResponse.json({ success: true, message: 'Left community' })
  } catch (error) {
    console.error('[v0] Error leaving community:', error)
    return NextResponse.json({ success: false, error: 'Failed to leave community' }, { status: 500 })
  }
}
