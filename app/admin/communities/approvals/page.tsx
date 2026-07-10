'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'
import { genderRestrictionLabel } from '@/lib/community-governance'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_DANGER } from '@/lib/admin-design-system'
import Link from 'next/link'
import { ChevronLeft, Users, MessageSquare } from 'lucide-react'

type PendingCommunity = {
  id: string
  type: 'community'
  name?: string
  description?: string
  businessId?: string
  genderRestriction?: string
  createdAt?: string
}

type PendingGroup = {
  id: string
  communityId?: string
  type: 'group'
  name?: string
  description?: string
  genderRestriction?: string
  createdAt?: string
}

export default function CommunityApprovalsPage() {
  const [communities, setCommunities] = useState<PendingCommunity[]>([])
  const [groups, setGroups] = useState<PendingGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not signed in')
      const token = await user.getIdToken()
      const res = await fetch('/api/admin/community-approvals', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load')
      setCommunities(json.data?.communities || [])
      setGroups(json.data?.groups || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (
    type: 'community' | 'group',
    id: string,
    action: 'approve' | 'reject',
    communityId?: string
  ) => {
    setActing(`${type}-${id}-${action}`)
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not signed in')
      const reason =
        action === 'reject'
          ? prompt('Rejection reason (optional):') || undefined
          : undefined
      const token = await user.getIdToken()
      const res = await fetch('/api/admin/community-approvals', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id, communityId, action, reason }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Action failed')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(null)
    }
  }

  return (
    <AdminPageLayout
      title="Community Approvals"
      subtitle="Review business-created communities and groups before they go live"
    >
      <div className="space-y-6">
        <Link
          href="/admin/communities"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to communities
        </Link>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm p-3">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-neutral-500">Loading pending approvals…</p>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending communities ({communities.length})
              </h2>
              {communities.length === 0 ? (
                <p className="text-sm text-neutral-500">No communities awaiting approval.</p>
              ) : (
                <div className="space-y-3">
                  {communities.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900">{c.name}</p>
                        <p className="text-sm text-neutral-600 line-clamp-2">{c.description}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {genderRestrictionLabel(c.genderRestriction)} · Business submission
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          data-dashboard-control
                          disabled={acting !== null}
                          className={`${BUTTON_PRIMARY} text-sm min-h-[36px] px-3`}
                          onClick={() => void act('community', c.id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          data-dashboard-control
                          disabled={acting !== null}
                          className={`${BUTTON_DANGER} text-sm min-h-[36px] px-3`}
                          onClick={() => void act('community', c.id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pending groups ({groups.length})
              </h2>
              {groups.length === 0 ? (
                <p className="text-sm text-neutral-500">No groups awaiting approval.</p>
              ) : (
                <div className="space-y-3">
                  {groups.map((g) => (
                    <div
                      key={`${g.communityId}-${g.id}`}
                      className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900">{g.name}</p>
                        <p className="text-sm text-neutral-600 line-clamp-2">{g.description}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {genderRestrictionLabel(g.genderRestriction)} · Community {g.communityId}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          data-dashboard-control
                          disabled={acting !== null}
                          className={`${BUTTON_PRIMARY} text-sm min-h-[36px] px-3`}
                          onClick={() => void act('group', g.id, 'approve', g.communityId)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          data-dashboard-control
                          disabled={acting !== null}
                          className={`${BUTTON_DANGER} text-sm min-h-[36px] px-3`}
                          onClick={() => void act('group', g.id, 'reject', g.communityId)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminPageLayout>
  )
}
