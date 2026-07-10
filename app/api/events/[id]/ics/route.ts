import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { buildEventIcs } from '@/lib/event-ics'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Ctx) {
  const { id } = await context.params
  const doc = await getAdminDb().collection('events').doc(id).get()
  if (!doc.exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const data = doc.data()!
  const ics = buildEventIcs({
    id: doc.id,
    title: data.title,
    description: data.description,
    locationName: data.locationName,
    locationAddress: data.locationAddress,
    startDate: data.startDate?.toDate?.() || data.startDate,
    endDate: data.endDate?.toDate?.() || data.endDate,
  })
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${(data.title || 'event').replace(/[^\w]+/g, '-')}.ics"`,
    },
  })
}
