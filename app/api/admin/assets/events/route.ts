import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export type AdminEventOption = {
  id: string
  title: string
  status?: string
  startDate?: string
  location?: string
}

export async function GET(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase()
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10)

    const snap = await getAdminDb().collection('events').limit(Math.min(limit, 200)).get()

    let events: AdminEventOption[] = snap.docs.map((doc) => {
      const data = serializeFirestoreDoc(doc.id, doc.data() as Record<string, unknown>)
      return {
        id: doc.id,
        title: String(data.title || data.name || 'Untitled event'),
        status: data.status as string | undefined,
        startDate: data.startDate as string | undefined,
        location: (data.location || data.venue) as string | undefined,
      }
    })

    events.sort((a, b) => {
      const aTime = new Date(a.startDate || 0).getTime()
      const bTime = new Date(b.startDate || 0).getTime()
      return bTime - aTime
    })

    if (q) {
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ success: true, data: events.slice(0, limit) })
  } catch (error) {
    console.error('[assets] events picker error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load events' }, { status: 500 })
  }
}
