'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CheckCircle2,
  BadgeCheck,
  Ban,
  Star,
  Trash2,
  RefreshCw,
  Store,
  AlertCircle,
} from 'lucide-react'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatRecordPhoneDisplay } from '@/lib/user-profile'
import { AdminUserProfileModal, AdminViewProfileButton } from '@/components/admin-user-profile-modal'
import { profileFromBusiness } from '@/lib/admin-profile-view'
import type { AdminProfileViewData } from '@/lib/admin-profile-view'
import { adminApiFetch } from '@/lib/admin-api-client'
import { useAuth } from '@/lib/auth-context'

type BusinessRow = {
  id: string
  name: string
  category: string
  ownerName: string
  email: string
  isApproved: boolean
  isActive: boolean
  isVerified: boolean
  featured: boolean
  isSponsor?: boolean
  isVendor?: boolean
  status: string
  referralCode?: string | null
  referralContributionPercent?: number | null
  ownerProfilePictureURL?: string | null
  phone?: string
  createdAt: string | Date | null
}

type FilterTab = 'all' | 'pending' | 'approved' | 'suspended' | 'featured' | 'sponsors' | 'vendors'

function BusinessesPageInner() {
  const { firebaseUser } = useAuth()
  const searchParams = useSearchParams()
  const focusId = searchParams.get('focus')
  const [businesses, setBusinesses] = React.useState<BusinessRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<FilterTab>(focusId ? 'pending' : 'all')
  const [search, setSearch] = React.useState('')
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [activeProfile, setActiveProfile] = React.useState<AdminProfileViewData | null>(null)
  const [highlightId, setHighlightId] = React.useState<string | null>(focusId)

  React.useEffect(() => {
    if (!focusId) return
    setHighlightId(focusId)
    setFilter('pending')
    const t = window.setTimeout(() => {
      document.getElementById(`business-row-${focusId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 500)
    return () => window.clearTimeout(t)
  }, [focusId, businesses.length])

  const openProfile = (biz: BusinessRow) => {
    setActiveProfile(profileFromBusiness(biz as unknown as Record<string, unknown>))
    setProfileOpen(true)
  }

  const fetchBusinesses = React.useCallback(async () => {
    if (!firebaseUser) {
      setLoading(false)
      return 
      
    }
    setLoading(true)
    setMessage(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search.trim()) params.set('search', search.trim())
      const qs = params.toString()
      const json = await adminApiFetch<BusinessRow[]>(
        `/api/admin/businesses${qs ? `?${qs}` : ''}`
      )
      if (!json.success) {
        throw new Error(json.error || 'Failed to load businesses')
      }
      setBusinesses(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      console.error('[v0] Error fetching businesses:', error)
      setBusinesses([])
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load businesses',
      })
    } finally {
      setLoading(false)
    }
  }, [filter, search, firebaseUser])

  React.useEffect(() => {
    void fetchBusinesses()
  }, [fetchBusinesses])

  const runAction = async (
    id: string,
    action:
      | 'approve'
      | 'verify'
      | 'suspend'
      | 'feature'
      | 'unfeature'
      | 'mark_sponsor'
      | 'unmark_sponsor'
      | 'delete'
      | 'set_referral_percent',
    extra?: Record<string, unknown>
  ) => {
    if (action === 'delete') {
      const ok = window.confirm(
        'Delete this business listing? Related jobs/offers will be soft-deactivated (not hard-deleted).'
      )
      if (!ok) return
    }

    setActingId(id)
    setMessage(null)
    try {
      const json = await adminApiFetch<BusinessRow>('/api/admin/businesses', {
        method: 'PATCH',
        body: JSON.stringify({ id, action, ...extra }),
      })
      if (!json.success) throw new Error(json.error || 'Action failed')
      setMessage({
        type: 'success',
        text: json.message || `Business ${action} successful`,
      })
      await fetchBusinesses()
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Action failed',
      })
    } finally {
      setActingId(null)
    }
  }

  const editReferralPercent = (biz: BusinessRow) => {
    const current =
      typeof biz.referralContributionPercent === 'number'
        ? String(biz.referralContributionPercent)
        : '10'
    const input = window.prompt(
      `Referral contribution % for ${biz.name} (0–100). Current: ${current}`,
      current
    )
    if (input === null) return
    const percent = Number(input)
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      setMessage({ type: 'error', text: 'Enter a number between 0 and 100.' })
      return
    }
    void runAction(biz.id, 'set_referral_percent', { referralContributionPercent: percent })
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'In directory' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'featured', label: 'Featured' },
  ]

  return (
    <AdminPageLayout
      title="Business Members"
      subtitle="Directory businesses · Vendors serve PB events · Sponsor requests are reviewed under Sponsor Inquiries"
    >
      <div className="space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`h-7 min-h-0 px-4 py-2 rounded-lg font-body text-sm font-semibold ${ filter === tab.id ? 'bg-black text-white' : 'bg-white text-black border border-[#e4e1da] hover:bg-neutral-50' }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => (window.location.href = '/admin/vendor-applications')}
              className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
            >
              Vendor applications
            </Button>
            <Button
              type="button"
              onClick={() => (window.location.href = '/admin/contact-submissions?category=partnership')}
              className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
            >
              Sponsor inquiries
            </Button>
            <Button
              type="button"
              onClick={() => void fetchBusinesses()}
              className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category, owner, email…"
          className="w-full min-h-[44px] px-4 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white"
        />

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm font-body ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded-lg" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <Card className="p-10 text-center">
            <Store className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <p className="font-headline text-xl font-bold mb-1">No businesses found</p>
            <p className="font-body text-sm text-neutral-600">
              Pending listing submissions will appear here for approval.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => {
              const busy = actingId === biz.id
              return (
                <Card
                  key={biz.id}
                  id={`business-row-${biz.id}`}
                  className={`p-4 sm:p-5 ${
                    highlightId === biz.id ? 'ring-2 ring-black border-black' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-headline text-xl font-bold text-neutral-900 break-words">
                          {biz.name}
                        </h3>
                        {!biz.isApproved && (
                          <span className="text-xs font-body font-semibold px-2 py-1 rounded bg-amber-100 text-amber-800">
                            Pending review
                          </span>
                        )}
                        {biz.isApproved && biz.isActive && (
                          <span className="text-xs font-body font-semibold px-2 py-1 rounded bg-green-100 text-green-800">
                            In directory
                          </span>
                        )}
                        {!biz.isActive && (
                          <span className="text-xs font-body font-semibold px-2 py-1 rounded bg-red-100 text-red-800">
                            Suspended
                          </span>
                        )}
                        {biz.isVerified && (
                          <span className="text-xs font-body font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {biz.featured && (
                          <span className="text-xs font-body font-semibold px-2 py-1 rounded bg-violet-100 text-violet-800 inline-flex items-center gap-1">
                            <Star className="w-3 h-3" /> Featured
                          </span>
                        )}
                        {biz.isVendor && (
                          <span className="text-xs font-body font-semibold px-2 py-1 rounded bg-sky-100 text-sky-800">
                            Vendor
                          </span>
                        )}
                        {biz.isSponsor && (
                          <span className="text-xs font-body font-semibold px-2 py-1 rounded bg-amber-100 text-amber-900">
                            Sponsor
                          </span>
                        )}
                      </div>
                      <p className="font-body text-sm text-neutral-600 break-words flex flex-wrap items-center gap-2">
                        {biz.ownerName ? (
                          <AdminUserCell
                            user={{
                              firstName: biz.ownerName,
                              profilePictureURL: biz.ownerProfilePictureURL || undefined,
                              email: biz.email,
                            }}
                            name={biz.ownerName}
                            subtitle={[biz.category, biz.email].filter(Boolean).join(' · ')}
                          />
                        ) : (
                          [biz.category, biz.ownerName, biz.email].filter(Boolean).join(' · ')
                        )}
                      </p>
                      <p className="font-body text-xs text-neutral-500">
                        Phone: {formatRecordPhoneDisplay(biz.phone)}
                      </p>
                      <p className="font-body text-xs text-neutral-500">ID: {biz.id}</p>
                      {biz.isApproved && biz.referralCode ? (
                        <p className="font-body text-xs text-neutral-600">
                          Referral code:{' '}
                          <span className="font-mono text-neutral-900">{biz.referralCode}</span>
                          {' · '}
                          Rate:{' '}
                          {typeof biz.referralContributionPercent === 'number'
                            ? `${biz.referralContributionPercent}%`
                            : 'default'}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <AdminViewProfileButton onClick={() => openProfile(biz)} />
                      {!biz.isApproved && (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void runAction(biz.id, 'approve')}
                          className="h-7 min-h-0 bg-black text-white hover:bg-gray-800"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve
                        </Button>
                      )}
                      {biz.isApproved ? (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => editReferralPercent(biz)}
                          className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
                        >
                          Referral %
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        disabled={busy || biz.isVerified}
                        onClick={() => void runAction(biz.id, 'verify')}
                        className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
                      >
                        <BadgeCheck className="w-4 h-4 mr-1.5" />
                        Verify
                      </Button>
                      {biz.isActive ? (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void runAction(biz.id, 'suspend')}
                          className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
                        >
                          <Ban className="w-4 h-4 mr-1.5" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void runAction(biz.id, 'approve')}
                          className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
                        >
                          Reactivate
                        </Button>
                      )}
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void runAction(biz.id, biz.featured ? 'unfeature' : 'feature')
                        }
                        className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
                      >
                        <Star className="w-4 h-4 mr-1.5" />
                        {biz.featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void runAction(
                            biz.id,
                            biz.isSponsor ? 'unmark_sponsor' : 'mark_sponsor'
                          )
                        }
                        className="h-7 min-h-0 bg-white text-black border border-[#e4e1da] hover:bg-neutral-50"
                        title="Blue tick on public directory cards"
                      >
                        <BadgeCheck className="w-4 h-4 mr-1.5 text-[#1D9BF0]" />
                        {biz.isSponsor ? 'Remove sponsor tick' : 'Mark as sponsor'}
                      </Button>
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => void runAction(biz.id, 'delete')}
                        className="h-7 min-h-0 bg-black !text-white hover:bg-neutral-800"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <AdminUserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={activeProfile}
        editLabel="Edit business"
      />
    </AdminPageLayout>
  )
}

export default function BusinessesPage() {
  return (
    <React.Suspense
      fallback={
        <AdminPageLayout title="Businesses" subtitle="Loading…">
          <p className="text-neutral-500 py-12 text-center">Loading businesses…</p>
        </AdminPageLayout>
      }
    >
      <BusinessesPageInner />
    </React.Suspense>
  )
}
