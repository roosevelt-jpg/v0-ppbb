import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query')

    if (query === 'stats') {
      // Get community stats
      const usersSnap = await db.collection('users').get()
      const eventsSnap = await db.collection('events').where('status', '==', 'published').get()
      const volunteersSnap = await db.collection('users').where('role', '==', 'volunteer').get()

      const stats = {
        totalMembers: usersSnap.size,
        publishedEvents: eventsSnap.size,
        volunteers: volunteersSnap.size,
        donations: 0, // Would need to calculate from donations collection
      }

      return NextResponse.json({ success: true, data: stats })
    }

    if (query === 'groups') {
      const snapshot = await db.collection('community-groups').orderBy('createdAt', 'desc').get()
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      }))

      return NextResponse.json({ success: true, data: groups })
    }

    if (query === 'activities') {
      const snapshot = await db.collection('community-activities').orderBy('createdAt', 'desc').limit(50).get()
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }))

      return NextResponse.json({ success: true, data: activities })
    }

    return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Community fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch community data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'group') {
      const { name, description, imageUrl, status } = data

      if (!name) {
        return NextResponse.json({ success: false, error: 'Missing group name' }, { status: 400 })
      }

      const groupData = {
        name,
        description,
        imageUrl, // Firebase Storage URL
        members: [],
        status: status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await db.collection('community-groups').add(groupData)

      return NextResponse.json({
        success: true,
        data: { id: docRef.id, ...groupData },
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Community creation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create community item' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 })
    }

    const collection = type === 'group' ? 'community-groups' : 'community-activities'
    updateData.updatedAt = new Date()

    await db.collection(collection).doc(id).update(updateData)

    return NextResponse.json({ success: true, message: 'Community item updated' })
  } catch (error) {
    console.error('[v0] Community update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update community item' }, { status: 500 })
  }
}
