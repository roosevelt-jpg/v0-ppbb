import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

export async function GET(request: NextRequest) {
  try {
    const userType = request.nextUrl.searchParams.get('userType')
    const status = request.nextUrl.searchParams.get('status')
    const search = request.nextUrl.searchParams.get('search')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '1000')

    let query = db.collection('users').limit(limit)

    const snapshot = await query.get()
    let members = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt?.toDate?.() || data.joinedAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      }
    })

    // Filter by user type (role in signup)
    if (userType) {
      members = members.filter(m => m.role === userType || m.userType === userType)
    }

    // Filter by status
    if (status) {
      members = members.filter(m => m.status === status)
    }

    // Search by name, email, location
    if (search) {
      const searchLower = search.toLowerCase()
      members = members.filter(m =>
        (m.name?.toLowerCase().includes(searchLower)) ||
        (m.email?.toLowerCase().includes(searchLower)) ||
        (m.location?.city?.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('[v0] Members fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing member ID' }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    await db.collection('users').doc(id).update(updateData)

    return NextResponse.json({ success: true, message: 'Member updated' })
  } catch (error) {
    console.error('[v0] Member update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update member' }, { status: 500 })
  }
}
