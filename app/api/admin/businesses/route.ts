import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const search = request.nextUrl.searchParams.get('search')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '1000')

    // Query users with business role
    let query = db.collection('users').where('role', '==', 'business').orderBy('dateJoined', 'desc').limit(limit)

    const snapshot = await query.get()
    let businesses = snapshot.docs.map(doc => {
      const data = doc.data()
      const dateJoined = data.dateJoined?.toDate?.() || (data.dateJoined instanceof Date ? data.dateJoined : new Date(data.dateJoined))
      const createdAt = data.createdAt?.toDate?.() || (data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt))
      
      return {
        id: doc.id,
        name: data.displayName || `${data.firstName} ${data.lastName}`,
        email: data.email,
        businessName: data.business?.name || 'N/A',
        businessType: data.business?.type || '',
        businessLocation: data.business?.location || data.emirate || '',
        businessPhone: data.phone,
        businessRegistration: data.business?.registration || '',
        businessDescription: data.business?.description || '',
        status: data.status || 'active',
        hasMemberRole: Array.isArray(data.roles) && data.roles.includes('member'),
        phone: data.phone,
        location: data.emirate,
        dateJoined: dateJoined,
        createdAt: createdAt,
        ...data,
      }
    })

    // Filter by status
    if (status) {
      businesses = businesses.filter(b => b.status === status)
    }

    // Search by business name, company name, email, location
    if (search) {
      const searchLower = search.toLowerCase()
      businesses = businesses.filter(b =>
        (b.businessName?.toLowerCase().includes(searchLower)) ||
        (b.name?.toLowerCase().includes(searchLower)) ||
        (b.email?.toLowerCase().includes(searchLower)) ||
        (b.businessLocation?.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json({ success: true, data: businesses })
  } catch (error) {
    console.error('[v0] Businesses fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing business ID' }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    await db.collection('users').doc(id).update(updateData)

    return NextResponse.json({ success: true, message: 'Business updated' })
  } catch (error) {
    console.error('[v0] Business update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update business' }, { status: 500 })
  }
}
