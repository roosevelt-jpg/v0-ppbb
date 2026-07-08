'use client'

import React, { useEffect, useState } from 'react'
import { OpportunitiesList } from '@/components/opportunities-list'
import { useAuth } from '@/lib/auth-context'
import { getMemberApplications } from '@/lib/business-queries'
import { JobApplication } from '@/lib/types'
import { Building2, Clock } from 'lucide-react'
import { BusinessFeatureLink } from '@/components/business-feature-gate'
import {
  DashboardPageShell,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-700',
  submitted: 'bg-neutral-100 text-neutral-700',
  reviewing: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function DashboardOpportunitiesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'browse' | 'applications'>('browse')
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tab !== 'applications' || !user?.id) return

    setLoadingApps(true)
    setError(null)

    getMemberApplications(user.id)
      .then((apps) => setApplications(apps ?? []))
      .catch((e) => {
        console.error('[v0] Failed to load applications:', e)
        setError(e.message || 'Failed to load applications')
      })
      .finally(() => setLoadingApps(false))
  }, [tab, user?.id])

  return (
    <DashboardPageShell
      title="Opportunities"
      subtitle="Browse and apply to jobs, internships, and gigs from community businesses."
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BusinessFeatureLink
          featureLabel="Post a Job"
          href="/business/opportunities/new"
          className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 !bg-white !text-black border border-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-50"
        >
          Post a Job
        </BusinessFeatureLink>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <DashboardTabButton active={tab === 'browse'} onClick={() => setTab('browse')}>
          Browse Opportunities
        </DashboardTabButton>
        <DashboardTabButton active={tab === 'applications'} onClick={() => setTab('applications')}>
          My Applications
        </DashboardTabButton>
      </div>

      {tab === 'browse' ? (
        <OpportunitiesList />
      ) : error ? (
        <div className="text-center py-12 border border-red-200 rounded-xl bg-red-50">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      ) : loadingApps ? (
        <div className="text-center py-12 text-neutral-500">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <DashboardEmptyState
          title="No applications yet"
          description="You haven't applied to any opportunities yet."
          action={
            <button
              type="button"
              onClick={() => setTab('browse')}
              className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Browse Opportunities
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-neutral-900">{app.opportunityTitle}</h3>
                <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{app.businessName}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Applied {new Date(app.createdAt as string | Date).toLocaleDateString()}</span>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full capitalize shrink-0 ${
                  STATUS_STYLES[app.status] || 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {app.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardPageShell>
  )
}
