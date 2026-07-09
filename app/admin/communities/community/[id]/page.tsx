'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { subscribeToCommunity, subscribeToCommunityGroups, createGroup, deleteGroup } from '@/lib/community-queries'
import type { Community, Group } from '@/lib/community-types'
import { ChevronLeft, Plus, Trash2, Edit2, Users, Shield } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { adminApiFetch } from '@/lib/admin-api-client'
import { GENDER_RESTRICTION_OPTIONS, genderRestrictionLabel } from '@/lib/community-governance'

const GROUP_TYPES = ['discussion', 'support', 'prayer', 'skill-share', 'networking']

type CommunityMemberRow = {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  memberStatus?: string
  role?: string
}

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.id as string

  const [community, setCommunity] = React.useState<Community | null>(null)
  const [groups, setGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showCreateGroup, setShowCreateGroup] = React.useState(false)
  const [groupForm, setGroupForm] = React.useState({
    name: '',
    description: '',
    type: 'discussion' as const,
    genderRestriction: 'mixed' as 'mixed' | 'male' | 'female',
    capacity: 50,
  })
  const [members, setMembers] = React.useState<CommunityMemberRow[]>([])
  const [moderatingId, setModeratingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const unsubCommunity = subscribeToCommunity(communityId, (data) => {
      setCommunity(data)
      setLoading(false)
    })

    const unsubGroups = subscribeToCommunityGroups(communityId, (data) => {
      setGroups(data)
    })

    return () => {
      unsubCommunity()
      unsubGroups()
    }
  }, [communityId])

  React.useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'communities', communityId, 'members'), (snap) => {
      setMembers(
        snap.docs.map((d) => ({
          id: d.id,
          userId: d.data().userId,
          userName: d.data().userName,
          userEmail: d.data().userEmail,
          memberStatus: d.data().memberStatus || 'active',
          role: d.data().role,
        }))
      )
    })
    return () => unsubMembers()
  }, [communityId])

  const handleModerateMember = async (
    member: CommunityMemberRow,
    action: 'suspend' | 'ban' | 'remove' | 'restore'
  ) => {
    const reason = action === 'restore' ? undefined : prompt(`Reason for ${action}?`) || undefined
    if (action !== 'restore' && reason === undefined && !confirm(`Proceed with ${action} without a reason?`)) {
      return
    }

    setModeratingId(member.id)
    try {
      const json = await adminApiFetch('/api/admin/community-members', {
        method: 'PATCH',
        body: JSON.stringify({
          communityId,
          memberDocId: member.id,
          userId: member.userId,
          action,
          reason,
          suspendDays: action === 'suspend' ? 7 : undefined,
        }),
      })
      if (!json.success) {
        alert(json.error || 'Moderation action failed')
      }
    } catch (error) {
      console.error('[v0] Error moderating member:', error)
      alert('Moderation action failed')
    } finally {
      setModeratingId(null)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGroup(communityId, {
        ...groupForm,
        createdBy: 'admin',
      })
      setGroupForm({ name: '', description: '', type: 'discussion', genderRestriction: 'mixed', capacity: 50 })
      setShowCreateGroup(false)
    } catch (error) {
      console.error('[v0] Error creating group:', error)
      alert('Failed to create group')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group?')) return
    try {
      await deleteGroup(communityId, groupId)
    } catch (error) {
      console.error('[v0] Error deleting group:', error)
      alert('Failed to delete group')
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Community Details">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AdminPageLayout>
    )
  }

  if (!community) {
    return (
      <AdminPageLayout title="Community Details">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Community not found</p>
          <button
            onClick={() => router.push('/admin/community')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Back to Communities
          </button>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Community Details">
      <div className="space-y-6">
        <button
          onClick={() => router.push('/admin/community')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Header */}
        <div className="space-y-4">
          {community.bannerURL && (
            <div
              className="w-full h-40 bg-gray-200 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${community.bannerURL})` }}
            />
          )}

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-black">{community.name}</h1>
              <p className="text-gray-600 mt-2">{community.description}</p>
            </div>
            <button
              onClick={() => router.push(`/admin/communities/create?id=${communityId}`)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-black">{community.memberCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Groups</p>
              <p className="text-2xl font-bold text-black">{community.groupCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-lg font-bold text-black">{community.category}</p>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-black">Groups ({groups.length})</h2>
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium flex items-center gap-2"
            >
              <Plus size={18} />
              New Group
            </button>
          </div>

          {/* Create Group Form */}
          {showCreateGroup && (
            <form onSubmit={handleCreateGroup} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  placeholder="e.g., JavaScript Discussion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  placeholder="Describe the group"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={groupForm.type}
                    onChange={(e) => setGroupForm({ ...groupForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  >
                    {GROUP_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={groupForm.genderRestriction}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        genderRestriction: e.target.value as 'mixed' | 'male' | 'female',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  >
                    {GENDER_RESTRICTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
                >
                  Create Group
                </button>
              </div>
            </form>
          )}

          {/* Groups List */}
          {groups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No groups created yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <h3 className="font-bold text-black">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users size={14} />
                      {group.memberCount} members
                    </div>
                    <span className="text-xs text-gray-500 capitalize">
                      {genderRestrictionLabel(group.genderRestriction)} · {group.type}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteGroup(group.id!)}
                    className="w-full px-3 py-1 text-red-700 hover:bg-red-50 rounded text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members moderation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <h2 className="text-xl font-bold text-black">Members ({members.length})</h2>
          </div>
          <p className="text-sm text-gray-600">
            As platform admin you can suspend, ban, or remove members who violate community guidelines.
          </p>
          {members.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">No members yet.</div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {members.map((member) => {
                const status = member.memberStatus || 'active'
                const isBusy = moderatingId === member.id
                return (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium text-black">{member.userName || 'Member'}</p>
                      <p className="text-sm text-gray-500">{member.userEmail}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">
                        {member.role || 'member'} · {status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {status !== 'active' ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleModerateMember(member, 'restore')}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleModerateMember(member, 'suspend')}
                            className="px-3 py-1 text-sm border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleModerateMember(member, 'ban')}
                            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          >
                            Ban
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleModerateMember(member, 'remove')}
                            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}
