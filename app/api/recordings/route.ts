import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

function normalizeRecording(id: string, data: Record<string, unknown>) {
  const thumbnailUrl =
    (typeof data.thumbnailUrl === 'string' && data.thumbnailUrl) ||
    (typeof data.thumbnail === 'string' && data.thumbnail) ||
    ''
  const createdAtRaw = data.createdAt as { toDate?: () => Date } | Date | string | null | undefined
  const updatedAtRaw = data.updatedAt as { toDate?: () => Date } | Date | string | null | undefined
  const createdAt =
    createdAtRaw && typeof createdAtRaw === 'object' && 'toDate' in createdAtRaw && createdAtRaw.toDate
      ? createdAtRaw.toDate()
      : createdAtRaw || null
  const updatedAt =
    updatedAtRaw && typeof updatedAtRaw === 'object' && 'toDate' in updatedAtRaw && updatedAtRaw.toDate
      ? updatedAtRaw.toDate()
      : updatedAtRaw || null

  return {
    id,
    ...data,
    url:
      typeof data.url === 'string'
        ? data.url
        : typeof data.videoUrl === 'string'
          ? data.videoUrl
          : '',
    thumbnailUrl,
    thumbnail: thumbnailUrl,
    speaker: typeof data.speaker === 'string' ? data.speaker : '',
    date:
      typeof data.date === 'string'
        ? data.date
        : createdAt instanceof Date
          ? createdAt.toISOString().slice(0, 10)
          : '',
    createdAt,
    updatedAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'published'
    const type = request.nextUrl.searchParams.get('type')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10)

    const db = getAdminDb()
    let snapshot
    if (status === 'all') {
      snapshot = await db.collection('recordings').orderBy('createdAt', 'desc').limit(limit).get()
    } else {
      try {
        snapshot = await db
          .collection('recordings')
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get()
      } catch {
        // Fallback if composite index missing
        snapshot = await db.collection('recordings').where('status', '==', status).limit(limit).get()
      }
    }

    let recordings = snapshot.docs.map((doc) =>
      normalizeRecording(doc.id, doc.data() as Record<string, unknown>)
    )

    if (type) {
      recordings = recordings.filter((r) => (r as { type?: string }).type === type)
    }

    recordings.sort((a, b) => {
      const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(String(a.createdAt || 0)).getTime()
      const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(String(b.createdAt || 0)).getTime()
      return tb - ta
    })

    return NextResponse.json({ success: true, data: recordings })
  } catch (error) {
    console.error('[v0] Recordings fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch recordings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      type,
      url,
      duration,
      thumbnailUrl,
      thumbnail,
      speaker,
      date,
      status,
    } = body as Record<string, unknown>

    if (!title || !type || !url) {
      return NextResponse.json(
        { success: false, error: 'Title, type, and recording URL are required' },
        { status: 400 }
      )
    }

    if (!['audio', 'video'].includes(String(type))) {
      return NextResponse.json(
        { success: false, error: 'Invalid recording type (must be audio or video)' },
        { status: 400 }
      )
    }

    const thumb =
      (typeof thumbnailUrl === 'string' && thumbnailUrl.trim()) ||
      (typeof thumbnail === 'string' && thumbnail.trim()) ||
      ''

    const recordingData = sanitizeForFirestore({
      title: String(title).trim(),
      description: typeof description === 'string' ? description.trim() : '',
      type: String(type),
      url: String(url).trim(),
      duration: typeof duration === 'number' ? duration : duration ? Number(duration) : null,
      thumbnailUrl: thumb,
      thumbnail: thumb,
      speaker: typeof speaker === 'string' ? speaker.trim() : '',
      date: typeof date === 'string' && date ? date : new Date().toISOString().slice(0, 10),
      status: status === 'published' ? 'published' : 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const docRef = await getAdminDb().collection('recordings').add(recordingData)

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...recordingData },
    })
  } catch (error) {
    console.error('[v0] Recording creation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create recording' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body as { id?: string; [key: string]: unknown }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing recording ID' }, { status: 400 })
    }

    if (typeof updateData.thumbnailUrl === 'string' && !updateData.thumbnail) {
      updateData.thumbnail = updateData.thumbnailUrl
    }
    if (typeof updateData.thumbnail === 'string' && !updateData.thumbnailUrl) {
      updateData.thumbnailUrl = updateData.thumbnail
    }

    updateData.updatedAt = new Date()

    await getAdminDb()
      .collection('recordings')
      .doc(id)
      .update(sanitizeForFirestore(updateData as Record<string, unknown>))

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

    await getAdminDb().collection('recordings').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Recording deleted' })
  } catch (error) {
    console.error('[v0] Recording delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete recording' }, { status: 500 })
  }
}
