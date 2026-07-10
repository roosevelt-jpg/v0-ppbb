import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'


export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    // Get single team member by ID
    if (id) {
      const doc = await db.collection('team-members').doc(id).get()
      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate?.() || doc.data()?.createdAt,
          updatedAt: doc.data()?.updatedAt?.toDate?.() || doc.data()?.updatedAt,
        },
      })
    }

    // Get all team members (filtered or all)
    const status = request.nextUrl.searchParams.get('status') || 'published'
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')

    let query = db.collection('team-members').where('status', '==', status).orderBy('order', 'asc').limit(limit)

    const snapshot = await query.get()
    const teamMembers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    return NextResponse.json({ success: true, data: teamMembers })
  } catch (error) {
    console.error('[v0] Team members fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, role, bio, imageUrl, socialLinks, order, status } = body

    if (!name || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const teamMemberData = {
      name,
      role,
      bio,
      imageUrl, // Firebase Storage URL only
      socialLinks: {
        linkedin: socialLinks?.linkedin || '',
        twitter: socialLinks?.twitter || '',
        email: socialLinks?.email || '',
        ...socialLinks,
      },
      order: order || 0,
      status: status || 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await db.collection('team-members').add(teamMemberData)

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...teamMemberData },
    })
  } catch (error) {
    console.error('[v0] Team member creation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create team member' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing team member ID' }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    await db.collection('team-members').doc(id).update(updateData)

    return NextResponse.json({ success: true, message: 'Team member updated' })
  } catch (error) {
    console.error('[v0] Team member update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing team member ID' }, { status: 400 })
    }

    await db.collection('team-members').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Team member deleted' })
  } catch (error) {
    console.error('[v0] Team member delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete team member' }, { status: 500 })
  }
}
