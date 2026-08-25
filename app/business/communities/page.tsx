'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { subscribeToBusinessCommunities } from '@/lib/business-queries'
import {
  joinCommunity,
  subscribeToAllCommunities,
  subscribeToUserCommunities,
} from '@/lib/community-queries'
import { Community } from '@/lib/community-types'
import { genderRestrictionBadgeClass, genderRestrictionLabel, isPendingApproval } from '@/lib/community-governance'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { db } from '@/lib/firebase'
import { deleteDoc, doc } from 'firebase/firestore'

type Tab = 'mine' | 'joined' | 'explore'

function ownsCommunity(community: Community, userId: string) {
  return community.businessId === userId || community.createdBy === userId
}

export default function BusinessCommunitiesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [communities, setCommunities] = React.useState<Community[]>([])
  const [explore, setExplore] = React.useState<Community[]>([])
  const [joined, setJoined] = React.useState<Community[]>([])
  const [joinedIds, setJoinedIds] = React.useState<Set<string>>(new Set())
  const [tab, setTab] = React.useState<Tab>('mine')
  const [loading, setLoading] = React.useState(true)
  const [joiningId, setJoiningId] = React.useState<string | null>(null)
  const [showApprovalsHint, setShowApprovalsHint] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowApprovalsHint(window.location.search.includes('focus=approvals'))
    }
  }, [])

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    const unsubscribe = subscribeToBusinessCommunities(user.id, (data) => {
      setCommunities(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  // Same directory source as member portal /communities explore
  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) return
    return subscribeToAllCommunities((rows) => {
      setExplore(rows.filter((c) => !ownsCommunity(c, user.id)))
    })
  }, [user])

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) return
    return subscribeToUserCommunities(user.id, (rows) => {
      setJoined(rows.filter((c) => !ownsCommunity(c, user.id)))
      setJoinedIds(new Set(rows.map((c) => c.id).filter(Boolean) as string[]))
    })
  }, [user])

  const handleDelete = async (communityId: string) => {
    if (!confirm('Delete this community?')) return
    try {
      await deleteDoc(doc(db, 'communities', communityId))
    } catch (error) {
      console.error('[v0] Error deleting community:', error)
      alert('Failed to delete community')
    }
  }

  const handleJoin = async (community: Community) => {
    if (!user || !community.id) return
    setJoiningId(community.id)
    try {
      await joinCommunity(
        community.id,
        user.id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '',
        user.email || '',
        user.gender,
        user.profilePictureURL || user.avatarUrl
      )
      setJoinedIds((prev) => new Set(prev).add(community.id!))
      setTab('joined')
    } catch (error) {
      console.error('[v0] Error joining community:', error)
      alert(error instanceof Error ? error.message : 'Failed to join community')
    } finally {
      setJoiningId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-muted-foreground">Loading communities...</p>
      </div>
    )
  }

  const list = tab === 'mine' ? communities : tab === 'joined' ? joined : explore

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--secondary)' }}>
      <div style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid #e4e1da', padding: '24px 32px' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between px-4 sm:px-0">
          <div>
            <h1 style={{ color: 'var(--foreground)', fontSize: '28px', fontWeight: 700 }}>Communities</h1>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Manage yours, explore others, and join to engage — same directory as the member portal
            </p>
            {showApprovalsHint ? (
              <p
                className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  maxWidth: '560px',
                }}
              >
                Open a community, then a group you created, to approve or reject pending members.
                The Pending Members panel appears for group creators and platform admins.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => router.push('/business/communities/create')}
            className="min-h-[44px] w-full sm:w-auto bg-neutral-900 text-white px-5 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-black"
          >
            <Plus size={18} />
            Create Community
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              { id: 'mine' as const, label: 'My communities' },
              { id: 'joined' as const, label: 'Joined' },
              { id: 'explore' as const, label: 'Explore' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                tab === t.id ? 'bg-black text-white border-black' : 'bg-white dark:bg-card text-black dark:text-foreground border-neutral-300 dark:border-border'
              }`}
            >
              {t.label}
            </button>
          ))}
          <Link
            href="/communities"
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-neutral-300 dark:border-border bg-white dark:bg-card text-black dark:text-foreground"
          >
            Full directory
          </Link>
        </div>

        {list.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }}>
              {tab === 'mine'
                ? 'No communities yet'
                : tab === 'joined'
                  ? 'You have not joined any other communities yet'
                  : 'No other communities to explore right now'}
            </p>
            {tab === 'mine' ? (
              <button
                onClick={() => router.push('/business/communities/create')}
                style={{
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
                className="hover:bg-black"
              >
                Create Your First Community
              </button>
            ) : tab === 'joined' ? (
              <button
                type="button"
                onClick={() => setTab('explore')}
                className="min-h-[44px] px-5 bg-black text-white rounded-lg font-semibold"
              >
                Explore communities
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((community) => {
              const isJoined = Boolean(community.id && joinedIds.has(community.id))
              return (
                <div
                  key={community.id}
                  style={{
                    backgroundColor: 'var(--card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    padding: '20px',
                  }}
                >
                  {community.bannerURL && (
                    <img
                      src={community.bannerURL}
                      alt={community.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 style={{ color: 'var(--foreground)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                    {community.name}
                  </h3>
                  {tab === 'mine' && isPendingApproval(community.status) ? (
                    <span
                      className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                      style={{
                        display: 'inline-block',
                        marginBottom: '8px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Pending admin approval
                    </span>
                  ) : tab === 'mine' && community.status === 'archived' ? (
                    <span
                      className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
                      style={{
                        display: 'inline-block',
                        marginBottom: '8px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Rejected / archived
                    </span>
                  ) : null}
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '12px' }}>
                    {community.description}
                  </p>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginBottom: '12px' }}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-medium ${genderRestrictionBadgeClass(community.genderRestriction)}`}
                    >
                      {genderRestrictionLabel(community.genderRestriction)}
                    </span>
                    {' · '}
                    {community.memberCount || 0} members · {community.groupCount || 0} groups
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {community.tags?.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {tab === 'explore' ? (
                      isJoined ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/communities/${community.id}`)}
                          className="flex-1 min-h-[44px] bg-neutral-900 text-white px-4 rounded-md text-sm font-semibold hover:bg-black"
                        >
                          Open
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={joiningId === community.id}
                          onClick={() => void handleJoin(community)}
                          className="flex-1 min-h-[44px] bg-neutral-900 text-white px-4 rounded-md text-sm font-semibold hover:bg-black disabled:opacity-60"
                        >
                          {joiningId === community.id ? 'Joining…' : 'Join'}
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(`/communities/${community.id}`)}
                        className="flex-1 min-h-[44px] bg-neutral-900 text-white px-4 rounded-md text-sm font-semibold hover:bg-black"
                      >
                        {tab === 'joined' ? 'Open groups & chat' : 'View'}
                      </button>
                    )}
                    {tab === 'mine' && !isPendingApproval(community.status) && community.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => router.push(`/business/communities/${community.id}/groups/create`)}
                        className="flex-1 min-h-[44px] bg-white dark:bg-card border border-neutral-300 dark:border-border text-neutral-900 dark:text-foreground px-4 rounded-md text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        Add Group
                      </button>
                    )}
                    {tab === 'mine' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => router.push(`/business/communities/create?edit=${community.id}`)}
                          className="min-h-[44px] min-w-[44px] px-3 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-900 dark:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          aria-label="Edit community"
                        >
                          <Edit2 size={16} className="mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(community.id)}
                          className="min-h-[44px] min-w-[44px] px-3 bg-black rounded-md !text-white hover:bg-neutral-800"
                          aria-label="Delete community"
                        >
                          <Trash2 size={16} className="mx-auto" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
