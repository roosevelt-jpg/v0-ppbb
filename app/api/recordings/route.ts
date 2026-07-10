import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'


export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'published'
    const type = request.nextUrl.searchParams.get('type') // 'audio' | 'video' | null for all
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')

    let query = db.collection('recordings').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit)

    const snapshot = await query.get()
    let recordings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    if (type) {
      recordings = recordings.filter(r => r.type === type)
    }

    return NextResponse.json({ success: true, data: recordings })
  } catch (error) {
    console.error('[v0] Recordings fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch recordings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, type, url, duration, thumbnail, speaker, createdAt, status } = body

    if (!title || !type || !url) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!['audio', 'video'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid recording type (must be audio or video)' }, { status: 400 })
    }

    const recordingData = {
      title,
      description,
      type, // 'audio' or 'video'
      url, // Firebase Storage URL
      duration, // in seconds
      thumbnail, // for video
      speaker,
      status: status || 'draft',
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: new Date(),
    }

    const docRef = await db.collection('recordings').add(recordingData)

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...recordingData },
    })
  } catch (error) {
    console.error('[v0] Recording creation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create recording' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing recording ID' }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    await db.collection('recordings').doc(id).update(updateData)

    return NextResponse.json({ success: true, message: 'Recording updated' })
  } catch (error) {
    console.error('[v0] Recording update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update recording' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing recording ID' }, { status: 400 })
    }

    await db.collection('recordings').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Recording deleted' })
  } catch (error) {
    console.error('[v0] Recording delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete recording' }, { status: 500 })
  }
}
