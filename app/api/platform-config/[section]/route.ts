import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

const ALLOWED_SECTIONS = new Set([
  'navigation',
  'globalSettings',
  'fonts',
  'homepage',
  'about',
  'events',
  'marketplace',
])

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section } = await params
    if (!ALLOWED_SECTIONS.has(section)) {
      return NextResponse.json({ success: false, error: 'Invalid section' }, { status: 400 })
    }

    const db = getAdminDb()
    const doc = await db.collection('platformConfig').doc(section).get()

    return NextResponse.json({
      success: true,
      data: doc.exists ? doc.data() : null,
    })
  } catch (error) {
    console.error('[v0] platform-config GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section } = await params
    if (!ALLOWED_SECTIONS.has(section)) {
      return NextResponse.json({ success: false, error: 'Invalid section' }, { status: 400 })
    }

    const body = await request.json()
    const db = getAdminDb()
    const docRef = db.collection('platformConfig').doc(section)

    const payload = sanitizeForFirestore({
      ...body,
      updatedAt: new Date(),
    })

    await docRef.set(payload, { merge: true })

    const updated = await docRef.get()
    return NextResponse.json({
      success: true,
      data: updated.data(),
      message: 'Configuration saved successfully',
    })
  } catch (error) {
    console.error('[v0] platform-config POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 })
  }
}
