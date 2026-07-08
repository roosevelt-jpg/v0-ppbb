'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
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
  status: string
  createdAt: string | Date | null
}

type FilterTab = 'all' | 'pending' | 'approved' | 'suspended' | 'featured'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = React.useState<BusinessRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<FilterTab>('all')
  const [search, setSearch] = React.useState('')
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const fetchBusinesses = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search.trim()) params.set('search', search.trim())
      const response = await fetch(`/api/admin/businesses?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      if (data.success) {
        setBusinesses(data.data || [])
      }
    } catch (error) {
      console.error('[v0] Error fetching businesses:', error)
      setMessage({ type: 'error', text: 'Failed to load businesses' })
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  React.useEffect(() => {
    void fetchBusinesses()
  }, [fetchBusinesses])

  const runAction = async (
    id: string,
    action: 'approve' | 'verify' | 'suspend' | 'feature' | 'unfeature' | 'delete'
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
      const res = await fetch('/api/admin/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const json = await res.json()
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

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'featured', label: 'Featured' },
  ]

  return (
    <AdminPageLayout
      title="Businesses"
      subtitle="Approve marketplace listings · Verify · Suspend · Feature · Delete"
    >
      <div className="space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-lg font-body text-sm font-semibold ${
                  filter === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-[#e4e1da] hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => void fetchBusinesses()}
            className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
                <Card key={biz.id} className="p-4 sm:p-5">
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
                      </div>
                      <p className="font-body text-sm text-neutral-600 break-words">
                        {[biz.category, biz.ownerName, biz.email].filter(Boolean).join(' · ')}
                      </p>
                      <p className="font-body text-xs text-neutral-500">ID: {biz.id}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {!biz.isApproved && (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void runAction(biz.id, 'approve')}
                          className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve
                        </Button>
                      )}
                      <Button
                        type="button"
                        disabled={busy || biz.isVerified}
                        onClick={() => void runAction(biz.id, 'verify')}
                        className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px]"
                      >
                        <BadgeCheck className="w-4 h-4 mr-1.5" />
                        Verify
                      </Button>
                      {biz.isActive ? (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void runAction(biz.id, 'suspend')}
                          className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px]"
                        >
                          <Ban className="w-4 h-4 mr-1.5" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void runAction(biz.id, 'approve')}
                          className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px]"
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
                        className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px]"
                      >
                        <Star className="w-4 h-4 mr-1.5" />
                        {biz.featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => void runAction(biz.id, 'delete')}
                        className="bg-red-600 text-white hover:bg-red-700 min-h-[44px]"
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
    </AdminPageLayout>
  )
}
