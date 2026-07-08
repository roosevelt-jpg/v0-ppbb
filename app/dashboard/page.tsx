'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { Calendar, Heart, Briefcase, Clock, ArrowRight } from 'lucide-react'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
} from '@/components/dashboard-states'
import { getMemberApplications } from '@/lib/business-queries'
import type { User } from '@/lib/types'

function formatMemberDate(value: unknown): string {
  if (!value) return '—'
  try {
    const d =
      typeof value === 'object' && value !== null && 'toDate' in value
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string | number)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

function eventVisibleToUser(event: Record<string, unknown>, gender?: string): boolean {
  const restriction = event.genderRestriction as string | undefined
  if (!restriction || restriction === 'mixed') return true
  if (!gender) return true
  if (restriction === 'ladies-only') return gender === 'female'
  if (restriction === 'men-only') return gender === 'male'
  return true
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = React.useState({
    upcomingEvents: 0,
    applications: 0,
    donations: 0,
    volunteerHours: 0,
  })
  const [upcomingEvents, setUpcomingEvents] = React.useState<Record<string, unknown>[]>([])
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

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const member = user as User
        const now = new Date()

        const [eventsResult, appsResult, donationsResult, profileResult] =
          await Promise.allSettled([
            getDocs(
              query(
                collection(db, 'events'),
                where('status', '==', 'published'),
                orderBy('startDate', 'asc'),
                limit(20)
              )
            ),
            getMemberApplications(user.id),
            getDocs(
              query(
                collection(db, 'donations'),
                where('userId', '==', user.id),
                limit(50)
              )
            ),
            getDoc(doc(db, 'users', user.id)),
          ])

        if (cancelled) return

        const allEvents =
          eventsResult.status === 'fulfilled'
            ? (eventsResult.value?.docs?.map((d) => ({ id: d.id, ...d.data() })) ?? [])
            : []

        const futureEvents = allEvents
          .filter((e) => {
            const start = e.startDate
            const startDate =
              typeof start === 'object' && start !== null && 'toDate' in start
                ? (start as { toDate: () => Date }).toDate()
                : new Date(start as string)
            return !Number.isNaN(startDate.getTime()) && startDate >= now
          })
          .filter((e) => eventVisibleToUser(e, member.gender))
          .slice(0, 3)

        const apps =
          appsResult.status === 'fulfilled' ? (appsResult.value ?? []).slice(0, 3) : []

        const donationDocs =
          donationsResult.status === 'fulfilled'
            ? (donationsResult.value?.docs?.map((d) => d.data()) ?? [])
            : []

        const verifiedTotal = donationDocs
          .filter((d) => d.status === 'completed' || d.status === 'verified')
          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

        const profileHours =
          profileResult.status === 'fulfilled' && profileResult.value?.exists()
            ? Number(profileResult.value.data()?.volunteeredHours) || 0
            : Number(member.volunteeredHours) || 0

        setUpcomingEvents(futureEvents)
        setApplications(
          apps.map((a) => ({
            id: a.id,
            title: a.opportunityTitle,
            company: a.businessName,
            status: a.status,
            date: a.createdAt,
          }))
        )
        setStats({
          upcomingEvents: futureEvents.length,
          applications: appsResult.status === 'fulfilled' ? appsResult.value.length : 0,
          donations: verifiedTotal,
          volunteerHours: profileHours,
        })
      } catch (err) {
        console.error('[v0] Dashboard load error:', err)
        if (!cancelled) setError('Failed to load dashboard data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id, (user as User | null)?.gender])

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  const member = user as User | null
  const quickLinks = [
    { label: 'Browse Jobs', href: '/dashboard/opportunities' },
    { label: 'Browse Marketplace', href: '/dashboard/marketplace' },
    { label: 'Volunteer', href: '/dashboard/volunteering' },
    { label: 'Make Donation', href: '/donate' },
    { label: 'View Certificates', href: '/dashboard/certificates' },
    { label: 'Learning Resources', href: '/dashboard/learning' },
    { label: 'My Communities', href: '/dashboard/community' },
    { label: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <DashboardPageShell
      title="Dashboard"
      subtitle={`${member?.firstName ?? 'Member'} • Active member`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, href: '/dashboard/events' },
          { label: 'My Applications', value: stats.applications, icon: Briefcase, href: '/dashboard/opportunities' },
          { label: 'Total Donated', value: `AED ${stats.donations.toLocaleString()}`, icon: Heart, href: '/dashboard/donations' },
          { label: 'Volunteer Hours', value: stats.volunteerHours, icon: Clock, href: '/dashboard/volunteering' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="block rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{card.label}</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-2">{card.value}</p>
                </div>
                <Icon className="w-5 h-5 text-neutral-400" />
              </div>
            </Link>
          )
        })}
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neutral-900">Upcoming Events</h2>
          <Link href="/dashboard/events" className="text-sm font-medium text-neutral-600 hover:text-black">
            View All Events
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-neutral-500 border border-neutral-200 rounded-xl p-6 bg-white">
            No upcoming events right now. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvents.map((event) => (
              <div key={String(event.id)} className="border border-neutral-200 rounded-xl p-4 bg-white">
                <h3 className="font-semibold text-neutral-900 line-clamp-2">{String(event.title ?? 'Event')}</h3>
                <p className="text-sm text-neutral-500 mt-2">
                  {formatMemberDate(event.startDate)}
                  {event.locationName ? ` • ${String(event.locationName)}` : ''}
                </p>
                <Link
                  href={`/events/${event.id}`}
                  className="inline-flex mt-3 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neutral-900">Recent Applications</h2>
          <Link href="/dashboard/opportunities" className="text-sm font-medium text-neutral-600 hover:text-black">
            View All
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-neutral-500 border border-neutral-200 rounded-xl p-6 bg-white">
            No job applications yet.
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={String(app.id)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-neutral-200 rounded-xl p-4 bg-white"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{String(app.title ?? 'Role')}</p>
                  <p className="text-sm text-neutral-500">{String(app.company ?? '')}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 capitalize">
                  {String(app.status ?? 'submitted')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              {link.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </section>
    </DashboardPageShell>
  )
}
