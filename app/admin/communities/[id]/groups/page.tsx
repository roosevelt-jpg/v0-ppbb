'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Plus, Trash2, Edit2, Users, ChevronLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { adminApiFetch } from '@/lib/admin-api-client'
import { genderRestrictionLabel } from '@/lib/community-governance'

type GroupRow = {
  id: string
  name: string
  description?: string
  type?: string
  status?: string
  memberCount?: number
  genderRestriction?: string
  requiresApproval?: boolean
  capacity?: number | null
}

export default function CommunityGroupsPage() {
  const params = useParams()
  const communityId = params.id as string

  const [groups, setGroups] = React.useState<GroupRow[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadGroups = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/groups?communityId=${communityId}`)
      const data = await res.json()
      if (data.success) {
        setGroups(data.data)
      }
    } catch (error) {
      console.error('[v0] Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }, [communityId])

  React.useEffect(() => {
    void loadGroups()
  }, [loadGroups])

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? This action cannot be undone.')) return

    try {
      const json = await adminApiFetch(`/api/groups/${groupId}?communityId=${communityId}`, {
        method: 'DELETE',
      })
      if (json.success) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId))
      } else {
        alert(json.error || 'Failed to delete group')
      }
    } catch (error) {
      console.error('[v0] Error deleting group:', error)
      alert('Failed to delete group')
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Community Groups">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading groups...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Community Groups"
      subtitle="Create and manage groups — chat, members, join approval, gender rules, capacity"
    >
      <div className="space-y-6">
        <Link
          href={`/admin/communities/${communityId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={20} />
          Back to community
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-2xl font-bold text-black">Groups ({groups.length})</h2>
          <Link
            href={`/admin/communities/${communityId}/groups/create`}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium min-h-[44px]"
          >
            <Plus size={20} />
            Create Group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No groups created yet.</p>
            <Link
              href={`/admin/communities/${communityId}/groups/create`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
            >
              <Plus size={18} />
              Create First Group
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-xl border border-[#e4e1da] p-5 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 hover:border-neutral-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                    <span className="text-xs capitalize px-2 py-0.5 bg-gray-100 rounded">
                      {group.type?.replace('-', ' ') || 'discussion'}
                    </span>
                    {group.status === 'pending_approval' ? (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        pending approval
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {group.memberCount ?? 0} members
                    </span>
                    <span>{genderRestrictionLabel(group.genderRestriction)}</span>
                    {group.requiresApproval ? <span>Join approval on</span> : null}
                    {group.capacity ? <span>Cap: {group.capacity}</span> : null}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/communities/${communityId}/groups/${group.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-black border border-[#e4e1da] rounded-lg hover:bg-neutral-50 min-h-[40px]"
                    title="Open group chat"
                  >
                    <MessageCircle size={16} />
                    Open chat
                  </Link>
                  <Link
                    href={`/admin/communities/${communityId}/groups/${group.id}/edit`}
                    className="inline-flex items-center justify-center p-2 text-neutral-600 border border-[#e4e1da] rounded-lg hover:bg-neutral-50 min-h-[40px] min-w-[40px]"
                    title="Edit group"
                  >
                    <Edit2 size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="inline-flex items-center justify-center p-2 bg-black text-white rounded-lg hover:bg-neutral-800 min-h-[40px] min-w-[40px]"
                    title="Delete group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
