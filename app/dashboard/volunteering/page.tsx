'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Clock, Heart, Award, TrendingUp, Briefcase } from 'lucide-react'
import { getAllOpenOpportunities, getMemberApplications } from '@/lib/business-queries'
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

export default function VolunteeringPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = React.useState<'opportunities' | 'history'>('opportunities')
  const [volunteerData, setVolunteerData] = React.useState({
    totalHours: 0,
    thisMonthHours: 0,
    thisYearHours: 0,
    records: [] as VolunteerRecord[],
  })
  const [opportunities, setOpportunities] = React.useState<Record<string, unknown>[]>([])
  const [applications, setApplications] = React.useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }

    let cancelled = false

    const loadOpportunities = async () => {
      try {
        const opps = await getAllOpenOpportunities()
        if (!cancelled) {
          setOpportunities(
            opps
              .filter((o) => o.type === 'volunteer')
              .map((o) => ({ id: o.id, title: o.title, businessName: o.businessName, description: o.description }))
          )
        }
      } catch (err) {
        console.error('[v0] Volunteer opportunities error:', err)
      }
    }

    const loadApplications = async () => {
      try {
        const apps = await getMemberApplications(user.id)
        const volunteerIds = new Set(
          (await getAllOpenOpportunities()).filter((o) => o.type === 'volunteer').map((o) => o.id)
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

  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return 'Date TBA'
    try {
      const date =
        typeof timestamp === 'object' && 'toDate' in timestamp
          ? (timestamp as Timestamp).toDate()
          : new Date(timestamp as Date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Volunteering" subtitle="Give your time and skills to causes that matter">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Hours', value: volunteerData.totalHours, sub: 'All-time', icon: Clock },
          { label: 'This Year', value: volunteerData.thisYearHours, sub: String(new Date().getFullYear()), icon: TrendingUp },
          { label: 'This Month', value: volunteerData.thisMonthHours, sub: new Date().toLocaleDateString('en-US', { month: 'long' }), icon: Heart },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-5 border border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-xs text-neutral-400 mt-1">{stat.sub}</p>
                </div>
                <Icon className="w-10 h-10 text-neutral-200" />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <DashboardTabButton active={activeTab === 'opportunities'} onClick={() => setActiveTab('opportunities')}>
          Available Opportunities
        </DashboardTabButton>
        <DashboardTabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          My Volunteer History
        </DashboardTabButton>
      </div>

      {activeTab === 'opportunities' ? (
        opportunities.length === 0 ? (
          <DashboardEmptyState
            icon={<Briefcase className="w-12 h-12" />}
            title="No volunteering opportunities"
            description="No volunteering opportunities right now. Check back soon."
            action={
              <Link href="/dashboard/opportunities" className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Browse Opportunities
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <Card key={String(opp.id)} className="p-4 border border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800">Volunteer</span>
                    <h3 className="font-semibold text-neutral-900 mt-2">{String(opp.title ?? 'Role')}</h3>
                    <p className="text-sm text-neutral-500">{String(opp.businessName ?? '')}</p>
                    {opp.description ? (
                      <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{String(opp.description)}</p>
                    ) : null}
                  </div>
                  <Link
                    href="/dashboard/opportunities"
                    className="shrink-0 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold text-center"
                  >
                    Apply to Volunteer
                  </Link>
                </div>
              </Card>
            ))}
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
