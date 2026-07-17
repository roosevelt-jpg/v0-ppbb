import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { buildGoogleCalendarUrl } from '@/lib/google-calendar'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: Ctx) {
  const { id } = await context.params
  const doc = await getAdminDb().collection('events').doc(id).get()
  if (!doc.exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const data = doc.data()!
  const url = buildGoogleCalendarUrl({
    id: doc.id,
    title: data.title,
    description: data.description,
    locationName: data.locationName,
    locationAddress: data.locationAddress,
    startDate: data.startDate?.toDate?.() || data.startDate,
    endDate: data.endDate?.toDate?.() || data.endDate,
    date: data.date?.toDate?.() || data.date,
    time: data.time,
    startTime: data.startTime,
    endTime: data.endTime,
    timezone: data.timezone,
  })
  return NextResponse.redirect(url)
}
