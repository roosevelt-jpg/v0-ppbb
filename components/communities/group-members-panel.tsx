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

  if (loading) return <p className="p-4 text-sm text-neutral-500">Loading members…</p>
  if (error) return <p className="p-4 text-sm text-red-600">{error}</p>
  if (items.length === 0) {
    return <p className="p-4 text-sm text-neutral-500">No active members yet.</p>
  }

  return (
    <ul className="p-4 space-y-2">
      {items.map((item) => {
        const canOpen = item.profile.canViewFullProfile && !item.profile.hidden
        return (
          <li key={item.userId}>
            <button
              type="button"
              disabled={!canOpen}
              onClick={() => canOpen && onOpenProfile(item.userId)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white text-left ${
                canOpen ? 'hover:bg-neutral-50' : 'opacity-80 cursor-default'
              }`}
            >
              {item.profile.profilePictureURL ? (
                <img
                  src={item.profile.profilePictureURL}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">
                  {item.profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.profile.displayName}</p>
                <p className="text-xs text-neutral-500 capitalize">{item.role}</p>
              </div>
              {item.profile.hidden ? (
                <span className="text-[11px] text-neutral-500">Private</span>
              ) : canOpen ? (
                <span className="text-[11px] text-neutral-500">View</span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
