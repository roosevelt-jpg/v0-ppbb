import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const featured = searchParams.get('featured') === 'true'

    if (query === 'featured') {
      const snapshot = await db
        .collection('communities')
        .where('isFeatured', '==', true)
        .where('status', '==', 'active')
        .limit(6)
        .get()

      const communities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      }))

      return NextResponse.json({ success: true, data: communities })
    }

    // Get all active communities
    const snapshot = await db
      .collection('communities')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    const communities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    return NextResponse.json({ success: true, data: communities })
  } catch (error) {
    console.error('[v0] Error fetching communities:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch communities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const {
      name,
      description,
      category,
      visibility,
      rules,
      tags,
      genderRestriction,
      bannerURL,
      isFeatured,
      createdBy,
    } = body

    const docRef = await db.collection('communities').add({
      name,
      description,
      category,
      visibility: visibility || 'public',
      rules: Array.isArray(rules) ? rules : (rules ? rules.split('\n').filter((r: string) => r.trim()) : []),
      tags: tags || [],
      genderRestriction: genderRestriction || 'mixed',
      bannerURL: bannerURL || '',
      isFeatured: isFeatured || false,
      status: 'active',
      memberCount: 1,
      groupCount: 0,
      createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true, id: docRef.id })
  } catch (error) {
    console.error('[v0] Error creating community:', error)
    return NextResponse.json({ success: false, error: 'Failed to create community' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { id, ...updates } = body

    await db.collection('communities').doc(id).update({
      ...updates,
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error updating community:', error)
    return NextResponse.json({ success: false, error: 'Failed to update community' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Community ID required' }, { status: 400 })
    }

    await db.collection('communities').doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting community:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete community' }, { status: 500 })
  }
}
