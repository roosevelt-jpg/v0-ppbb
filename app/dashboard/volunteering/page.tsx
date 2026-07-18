'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Clock, Heart, Award, TrendingUp, Briefcase, CheckCircle2, Calendar } from 'lucide-react'
import { getAllOpenOpportunities, getMemberApplications } from '@/lib/business-queries'
import { matchesRoleTypeFilter } from '@/lib/opportunity-utils'
import { isCharityVolunteerEvent } from '@/lib/charity-event'
import { parseFirestoreDate } from '@/lib/member-dashboard'
import { getEventLocationLabel } from '@/lib/event-utils'
import { EventBannerThumb } from '@/components/events/event-banner-thumb'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'

interface VolunteerRecord {
  id: string
  userId: string
  eventTitle?: string
  hours: number
  date?: Timestamp
  description?: string
  verified?: boolean
}

type RegisteredCharityEvent = {
  id: string
  title?: string
  locationName?: string
  startDate?: unknown
  checkedInAt?: unknown
  registrationStatus?: string
}

export default function VolunteeringPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = React.useState<'opportunities' | 'history' | 'attendance'>(
    'opportunities'
  )
  const [volunteerData, setVolunteerData] = React.useState({
    totalHours: 0,
    thisMonthHours: 0,
    thisYearHours: 0,
    records: [] as VolunteerRecord[],
  })
  const [opportunities, setOpportunities] = React.useState<Record<string, unknown>[]>([])
  const [charityEvents, setCharityEvents] = React.useState<Record<string, unknown>[]>([])
  const [registeredCharity, setRegisteredCharity] = React.useState<RegisteredCharityEvent[]>([])
  const [applications, setApplications] = React.useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null)
  const [attendanceMessage, setAttendanceMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }

    let cancelled = false

    // Fix older flat per-event credits using each event’s start–end duration
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token || cancelled) return
        await fetch('/api/volunteering/reconcile-hours', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.error('[v0] Volunteer hours reconcile error:', err)
      }
    })()

    const loadOpportunities = async () => {
      try {
        const opps = await getAllOpenOpportunities()
        if (!cancelled) {
          setOpportunities(
            opps
              .filter((o) => matchesRoleTypeFilter(o, 'volunteer'))
              .map((o) => ({
                id: o.id,
                title: o.title,
                businessName: o.businessName || o.companyName,
                description: o.description,
                location: o.locationText || o.locationCity,
                kind: 'job',
              }))
          )
        }
      } catch (err) {
        console.error('[v0] Volunteer opportunities error:', err)
      }
    }

    const loadCharityEvents = async () => {
      try {
        // Prefer a high limit so charity events are not truncated by recent non-charity publishes
        const res = await fetch('/api/events?status=published&limit=200')
        const json = await res.json()
        const rows = Array.isArray(json.data) ? json.data : []
        const now = Date.now()
        const charity = rows
          .filter((e: Record<string, unknown>) => {
            if (!isCharityVolunteerEvent(e)) return false
            const start = parseFirestoreDate(e.startDate)
            // Show upcoming + events from the last day (same-day / just-ended still listed)
            return !start || start.getTime() >= now - 86400000
          })
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const ad = parseFirestoreDate(a.startDate)?.getTime() ?? 0
            const bd = parseFirestoreDate(b.startDate)?.getTime() ?? 0
            return ad - bd
          })
          .map((e: Record<string, unknown>) => ({
            id: e.id,
            title: e.title,
            businessName: e.locationName || e.location || 'Community event',
            description: e.description,
            startDate: e.startDate,
            kind: 'event',
          }))
        if (!cancelled) setCharityEvents(charity)
      } catch (err) {
        console.error('[v0] Charity events error:', err)
        // Fallback: client Firestore read if API fails
        try {
          const snap = await getDocs(
            query(collection(db, 'events'), where('status', '==', 'published'))
          )
          const now = Date.now()
          const charity = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
            .filter((e) => {
              if (!isCharityVolunteerEvent(e)) return false
              const start = parseFirestoreDate(e.startDate)
              return !start || start.getTime() >= now - 86400000
            })
            .map((e) => ({
              id: e.id,
              title: e.title,
              businessName: e.locationName || e.location || 'Community event',
              description: e.description,
              startDate: e.startDate,
              kind: 'event',
            }))
          if (!cancelled) setCharityEvents(charity)
        } catch (fallbackErr) {
          console.error('[v0] Charity events fallback error:', fallbackErr)
        }
      }
    }

    const loadRegisteredCharity = async () => {
      try {
        const res = await fetch(`/api/user/events?userId=${encodeURIComponent(user.id)}`)
        const json = await res.json()
        if (!json.success || !Array.isArray(json.data)) {
          if (!cancelled) setRegisteredCharity([])
          return
        }
        const rows = (json.data as RegisteredCharityEvent[])
          .filter((e) => isCharityVolunteerEvent(e as Record<string, unknown>))
          .sort((a, b) => {
            const ad = a.startDate ? new Date(String(a.startDate)).getTime() : 0
            const bd = b.startDate ? new Date(String(b.startDate)).getTime() : 0
            return bd - ad
          })
        if (!cancelled) setRegisteredCharity(rows)
      } catch (err) {
        console.error('[v0] Registered charity events error:', err)
      }
    }

    const loadApplications = async () => {
      try {
        const apps = await getMemberApplications(user.id)
        const volunteerIds = new Set(
          (await getAllOpenOpportunities())
            .filter((o) => matchesRoleTypeFilter(o, 'volunteer'))
            .map((o) => o.id)
        )
        if (!cancelled) {
          setApplications(
            apps
              .filter((a) => volunteerIds.has(a.opportunityId))
              .map((a) => ({
                id: a.id,
                title: a.opportunityTitle,
                company: a.businessName,
                status: a.status,
                date: a.createdAt,
              }))
          )
        }
      } catch (err) {
        console.error('[v0] Volunteer applications error:', err)
      }
    }

    loadOpportunities()
    loadCharityEvents()
    loadRegisteredCharity()
    loadApplications()

    const q = query(collection(db, 'volunteerRecords'), where('userId', '==', user.id))
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const records =
            snapshot?.docs?.map((d) => ({ id: d.id, ...d.data() } as VolunteerRecord)) ?? []

          records.sort((a, b) => {
            const aDate = a.date?.toDate?.() ?? new Date(0)
            const bDate = b.date?.toDate?.() ?? new Date(0)
            return bDate.getTime() - aDate.getTime()
          })

          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()

          const thisMonthHours = records
            .filter((r) => {
              const rDate = r.date?.toDate?.() ?? new Date(0)
              return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear
            })
            .reduce((sum, r) => sum + (r.hours || 0), 0)

          const thisYearHours = records
            .filter((r) => (r.date?.toDate?.() ?? new Date(0)).getFullYear() === currentYear)
            .reduce((sum, r) => sum + (r.hours || 0), 0)

          const totalHours = records.reduce((sum, r) => sum + (r.hours || 0), 0)

          const userSnap = await getDoc(doc(db, 'users', user.id))
          const profileHours = Number(userSnap.data()?.volunteeredHours) || 0

          if (!cancelled) {
            setVolunteerData({
              totalHours: Math.max(totalHours, profileHours),
              thisMonthHours,
              thisYearHours,
              records,
            })
            setError(null)
            setLoading(false)
          }
        } catch (err) {
          console.error('[v0] Error processing volunteer data:', err)
          if (!cancelled) {
            setError('Failed to process volunteer data.')
            setLoading(false)
          }
        }
      },
      (err) => {
        console.error('[v0] Firestore volunteer records error:', err)
        if (!cancelled) {
          setError(err.message || 'Failed to load volunteer records.')
          setLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [authLoading, user?.id])

  const formatDate = (timestamp: Timestamp | Date | string | undefined) => {
    if (!timestamp) return 'Date TBA'
    try {
      const date =
        typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp
          ? (timestamp as Timestamp).toDate()
          : new Date(timestamp as Date | string)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }

  const confirmAttendance = async (eventId: string) => {
    setConfirmingId(eventId)
    setAttendanceMessage(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch(`/api/events/${eventId}/confirm-attendance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not confirm attendance')
      setAttendanceMessage(String(json.message || 'Attendance confirmed.'))
      setRegisteredCharity((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, checkedInAt: new Date().toISOString() } : e))
      )
    } catch (err) {
      setAttendanceMessage(err instanceof Error ? err.message : 'Could not confirm attendance')
    } finally {
      setConfirmingId(null)
    }
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Volunteering" subtitle="Give your time and skills to causes that matter">
      <Card className="p-4 mb-6 border border-neutral-200 bg-neutral-50">
        <p className="text-sm text-neutral-700">
          Confirm attendance at charity events to add hours equal to each event’s start–end time
          toward your certificates, then{' '}
          <Link href="/dashboard/certificates" className="underline font-medium text-neutral-900">
            issue your certificate
          </Link>
          .
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-6">
        {[
          { label: 'Total Hours', value: volunteerData.totalHours, sub: 'All-time', icon: Clock },
          { label: 'This Year', value: volunteerData.thisYearHours, sub: String(new Date().getFullYear()), icon: TrendingUp },
          { label: 'This Month', value: volunteerData.thisMonthHours, sub: new Date().toLocaleDateString('en-US', { month: 'long' }), icon: Heart },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="pb-stat-card p-3 border border-neutral-200">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="pb-stat-label text-[10px] uppercase tracking-wide text-neutral-500">{stat.label}</p>
                  <p className="pb-stat-value font-headline text-xl font-bold text-neutral-900 mt-1">{stat.value}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{stat.sub}</p>
                </div>
                <Icon className="w-5 h-5 text-neutral-300 shrink-0" />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <DashboardTabButton active={activeTab === 'opportunities'} onClick={() => setActiveTab('opportunities')}>
          Available Opportunities
        </DashboardTabButton>
        <DashboardTabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')}>
          Confirm attendance
        </DashboardTabButton>
        <DashboardTabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          My Volunteer History
        </DashboardTabButton>
      </div>

      {attendanceMessage ? (
        <p className="mb-4 text-sm text-neutral-700 bg-white border border-neutral-200 rounded-lg px-3 py-2">
          {attendanceMessage}
        </p>
      ) : null}

      {activeTab === 'opportunities' ? (
        opportunities.length === 0 && charityEvents.length === 0 ? (
          <DashboardEmptyState
            icon={<Briefcase className="w-12 h-12" />}
            title="No volunteering opportunities"
            description="Charity events and volunteer roles will appear here when published."
            action={
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/events" className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold text-center">
                  Browse events
                </Link>
                <Link href="/opportunities?type=volunteer" className="border border-neutral-300 px-4 py-2 rounded-lg text-sm font-semibold text-center">
                  Browse opportunities
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                Charity events ({charityEvents.length})
              </h2>
              {charityEvents.length === 0 ? (
                <p className="text-sm text-neutral-500">No upcoming charity events right now.</p>
              ) : (
                <div className="space-y-3">
                  {charityEvents.map((evt) => (
                    <Card key={`evt-${String(evt.id)}`} className="border border-neutral-200 overflow-hidden p-0">
                      <div className="flex flex-col sm:flex-row">
                        <EventBannerThumb
                          event={evt}
                          title={String(evt.title ?? 'Event')}
                          size="md"
                          rounded="rounded-none"
                          className="sm:!h-auto sm:!min-h-[120px] sm:!w-40"
                        />
                        <div className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 flex-1 min-w-0">
                        <div>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-neutral-900 text-white">
                            Charity event
                          </span>
                          <h3 className="font-semibold text-neutral-900 mt-2">{String(evt.title ?? 'Event')}</h3>
                          <p className="text-sm text-neutral-500 flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {evt.startDate
                              ? parseFirestoreDate(evt.startDate)?.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }) || String(evt.businessName ?? '')
                              : String(evt.businessName ?? '')}
                          </p>
                          {evt.businessName ? (
                            <p className="text-sm text-neutral-500">{String(evt.businessName)}</p>
                          ) : null}
                          {evt.description ? (
                            <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{String(evt.description)}</p>
                          ) : null}
                        </div>
                        <Link
                          href={`/events/${String(evt.id)}`}
                          className="shrink-0 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold text-center"
                        >
                          View & register
                        </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                Volunteer roles ({opportunities.length})
              </h2>
              {opportunities.length === 0 ? (
                <p className="text-sm text-neutral-500">No open volunteer jobs right now.</p>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <Card key={String(opp.id)} className="p-4 border border-neutral-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold px-2 py-1 rounded border border-neutral-300 text-neutral-800">
                            Volunteer role
                          </span>
                          <h3 className="font-semibold text-neutral-900 mt-2">{String(opp.title ?? 'Role')}</h3>
                          <p className="text-sm text-neutral-500">{String(opp.businessName ?? '')}</p>
                          {opp.location ? (
                            <p className="text-xs text-neutral-400 mt-1 break-words min-w-0">
                              {/^https?:\/\//i.test(String(opp.location).trim())
                                ? 'View map / location on listing'
                                : String(opp.location)}
                            </p>
                          ) : null}
                          {opp.description ? (
                            <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{String(opp.description)}</p>
                          ) : null}
                        </div>
                        <Link
                          href={`/opportunities/${String(opp.id)}`}
                          className="shrink-0 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold text-center"
                        >
                          Apply to volunteer
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      ) : activeTab === 'attendance' ? (
        registeredCharity.length === 0 ? (
          <DashboardEmptyState
            icon={<CheckCircle2 className="w-12 h-12" />}
            title="No charity events registered"
            description="Register for a charity event, attend, then confirm attendance here to earn certificate hours."
            action={
              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Browse charity events
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {registeredCharity.map((evt) => {
              const attended = Boolean(evt.checkedInAt)
              return (
                <Card key={evt.id} className="border border-neutral-200 overflow-hidden p-0">
                  <div className="flex flex-col sm:flex-row">
                    <EventBannerThumb
                      event={evt as never}
                      title={evt.title || 'Event'}
                      size="md"
                      rounded="rounded-none"
                      className="sm:!h-auto sm:!min-h-[120px] sm:!w-40"
                    />
                  <div className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 flex-1 min-w-0">
                    <div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-rose-100 text-rose-800">
                        Charity event
                      </span>
                      <h3 className="font-semibold text-neutral-900 mt-2">{evt.title || 'Event'}</h3>
                      <p className="text-sm text-neutral-500 break-words">
                        {getEventLocationLabel(evt as never)}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatDate(evt.startDate as string | Date | undefined)}
                      </p>
                    </div>
                    {attended ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Hours credited
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={confirmingId === evt.id || evt.registrationStatus !== 'confirmed'}
                        onClick={() => void confirmAttendance(evt.id)}
                        className="shrink-0 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {confirmingId === evt.id
                          ? 'Confirming…'
                          : evt.registrationStatus !== 'confirmed'
                            ? 'Pending approval'
                            : 'Confirm attendance'}
                      </button>
                    )}
                  </div>
                  </div>
                </Card>
              )
            })}
            <p className="text-xs text-neutral-500 pt-2">
              After hours are credited, go to{' '}
              <Link href="/dashboard/certificates" className="underline font-medium text-neutral-800">
                Certificates
              </Link>{' '}
              and tap Issue my certificates.
            </p>
          </div>
        )
      ) : volunteerData.records.length === 0 && applications.length === 0 ? (
        <DashboardEmptyState
          icon={<Award className="w-12 h-12" />}
          title="No volunteer history yet"
          description="You haven't volunteered yet. Browse opportunities above."
          action={
            <button
              type="button"
              onClick={() => setActiveTab('opportunities')}
              className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Browse Opportunities
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={`app-${app.id}`} className="p-4 border border-neutral-200">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{String(app.title ?? 'Volunteer role')}</h3>
                  <p className="text-sm text-neutral-500">{String(app.company ?? '')}</p>
                  <p className="text-xs text-neutral-400 mt-1">Applied {formatDate(app.date as Timestamp)}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-neutral-100 capitalize h-fit">
                  {String(app.status ?? 'submitted')}
                </span>
              </div>
            </Card>
          ))}
          {volunteerData.records.map((record) => (
            <Card key={record.id} className="p-4 border border-neutral-200">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{record.eventTitle || 'Volunteer Activity'}</h3>
                  {record.description ? <p className="text-sm text-neutral-600 mt-1">{record.description}</p> : null}
                  <p className="text-xs text-neutral-400 mt-2">{formatDate(record.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-neutral-900">{record.hours}</p>
                  <p className="text-xs text-neutral-500">hours</p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs rounded font-semibold ${
                      record.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {record.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardPageShell>
  )
}
