'use client'

import React from 'react'
import Link from 'next/link'
import { subscribeToUserCommunities } from '@/lib/community-queries'
import type { Community } from '@/lib/community-types'
import { useAuth } from '@/lib/auth-context'
import { Users, Tag, ChevronRight, MessageCircle } from 'lucide-react'
import { genderRestrictionBadgeClass, genderRestrictionLabel } from '@/lib/community-governance'
import { CommunityListSkeleton } from '@/components/community-list-skeleton'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard-states'

export default function MyCommunities() {
  const { user, loading: authLoading } = useAuth()
  const [communities, setCommunities] = React.useState<Community[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToUserCommunities(user.id, (data) => {
      setCommunities(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (authLoading || loading) {
    return (
      <DashboardPageShell title="My Communities" subtitle="Loading your communities…">
        <CommunityListSkeleton count={3} />
      </DashboardPageShell>
    )
  }

  if (!user) {
    return (
      <DashboardPageShell title="My Communities" subtitle="Communities and groups you belong to">
        <DashboardEmptyState
          title="Sign in required"
          description="Please log in to view your communities."
          actionLabel="Log in"
          actionHref="/login"
        />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      title="My Communities"
      subtitle="WhatsApp-style communities — join groups to chat, share, and discuss"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <p className="text-sm text-neutral-600">
          {communities.length === 0
            ? 'Browse public communities and join groups that match your profile.'
            : `${communities.length} communit${communities.length === 1 ? 'y' : 'ies'} joined`}
        </p>
        <Link
          href="/communities"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-semibold min-h-[44px]"
        >
          Explore Communities
          <ChevronRight size={16} />
        </Link>
      </div>

      {communities.length === 0 ? (
        <DashboardEmptyState
          title="No communities yet"
          description="Join a community, then pick Men only, Ladies only, or Mixed groups inside it to start chatting."
          actionLabel="Browse Communities"
          actionHref="/communities"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {communities.map((community) => (
            <div
              key={community.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {community.bannerURL && (
                <div
                  className="w-full h-36 bg-neutral-100 bg-cover bg-center"
                  style={{ backgroundImage: `url(${community.bannerURL})` }}
                />
              )}

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg line-clamp-2">{community.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${genderRestrictionBadgeClass(community.genderRestriction)}`}
                    >
                      {genderRestrictionLabel(community.genderRestriction)}
                    </span>
                    <span>{community.groupCount || 0} groups</span>
                  </p>
                </div>

                <p className="text-sm text-neutral-600 line-clamp-2">{community.description}</p>

                {community.tags && community.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {community.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-700"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <Users size={14} />
                    {community.memberCount || 0} members
                  </div>
                </div>

                <Link
                  href={`/communities/${community.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 min-h-[44px]"
                >
                  <MessageCircle size={16} />
                  Open groups & chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPageShell>
  )
}
