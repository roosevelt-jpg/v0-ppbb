'use client'

import React, { useEffect, useState } from 'react'
import { OpportunitiesList } from '@/components/opportunities-list'
import { useAuth } from '@/lib/auth-context'
import { getMemberApplications } from '@/lib/business-queries'
import { JobApplication } from '@/lib/types'
import { Building2, Clock, AlertCircle } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-secondary text-secondary-foreground',
  reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  shortlisted: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

export default function DashboardOpportunitiesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'browse' | 'applications'>('browse')
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tab !== 'applications' || !user) return
    
    console.log('[v0] Loading applications for user:', user.id)
    setLoadingApps(true)
    setError(null)
    
    getMemberApplications(user.id)
      .then((apps) => {
        console.log('[v0] Applications loaded:', apps.length)
        setApplications(apps)
      })
      .catch((e) => {
        console.error('[v0] Failed to load applications:', e)
        setError(e.message || 'Failed to load applications')
      })
      .finally(() => setLoadingApps(false))
  }, [tab, user])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
        <p className="text-muted-foreground">
          Browse and apply to jobs, internships, and gigs from community businesses.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            tab === 'browse'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setTab('applications')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            tab === 'applications'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          My Applications
        </button>
      </div>

      {tab === 'browse' ? (
        <div>
          <OpportunitiesList />
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-700 font-semibold">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : loadingApps ? (
        <div className="text-center py-12 text-muted-foreground">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-lg">
          <p className="text-muted-foreground">
            You haven&apos;t applied to any opportunities yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="border border-border rounded-lg p-4 flex items-center justify-between bg-card"
            >
              <div>
                <h3 className="font-semibold text-foreground">{app.opportunityTitle}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{app.businessName}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Applied {new Date(app.createdAt as any).toLocaleDateString()}</span>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                  STATUS_STYLES[app.status] || 'bg-secondary text-secondary-foreground'
                }`}
              >
                {app.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
