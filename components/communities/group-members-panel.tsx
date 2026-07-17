'use client'

import React from 'react'
import { auth } from '@/lib/firebase'
import type { PublicMemberProfile } from '@/lib/user-settings'

type RosterItem = {
  userId: string
  role: string
  profile: PublicMemberProfile
}

type GroupMembersPanelProps = {
  communityId: string
  groupId: string
  onOpenProfile: (userId: string) => void
}

export function GroupMembersPanel({
  communityId,
  groupId,
  onOpenProfile,
}: GroupMembersPanelProps) {
  const [items, setItems] = React.useState<RosterItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch(`/api/groups/${groupId}/roster?communityId=${communityId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to load members')
        if (!cancelled) setItems(json.data || [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load members')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [communityId, groupId])

  if (loading) {
    return (
      <p className="px-4 sm:px-6 lg:px-8 py-10 text-sm text-neutral-500 text-center">
        Loading members…
      </p>
    )
  }
  if (error) {
    return (
      <p className="px-4 sm:px-6 lg:px-8 py-10 text-sm text-red-600 text-center">{error}</p>
    )
  }
  if (items.length === 0) {
    return (
      <p className="px-4 sm:px-6 lg:px-8 py-10 text-sm text-neutral-500 text-center">
        No active members yet.
      </p>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="space-y-1 mb-2">
          <h2 className="font-headline text-xl sm:text-2xl font-bold">Members</h2>
          <p className="text-sm text-neutral-500">{items.length} active in this group</p>
        </div>
        <ul className="space-y-3">
          {items.map((item) => {
            const canOpen = item.profile.canViewFullProfile && !item.profile.hidden
            return (
              <li key={item.userId}>
                <button
                  type="button"
                  disabled={!canOpen}
                  onClick={() => canOpen && onOpenProfile(item.userId)}
              className={`pb-ghost-btn w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-[#e4e1da] bg-white text-left ${
                canOpen ? 'hover:bg-neutral-50' : 'opacity-80 cursor-default'
              }`}
                >
                  {item.profile.profilePictureURL ? (
                    <img
                      src={item.profile.profilePictureURL}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">
                      {item.profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{item.profile.displayName}</p>
                    <p className="text-xs text-neutral-500 capitalize mt-0.5">{item.role}</p>
                  </div>
                  {item.profile.hidden ? (
                    <span className="text-[11px] text-neutral-500">Private</span>
                  ) : canOpen ? (
                    <span className="text-[11px] font-medium text-neutral-600">View</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
