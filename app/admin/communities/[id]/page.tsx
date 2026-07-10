'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { subscribeToCommunity, subscribeToCommunityGroups, deleteGroup } from '@/lib/community-queries'
import type { Community, Group } from '@/lib/community-types'
import { ChevronLeft, Plus, Trash2, Edit2, Users, Shield, Layers, MessageCircle } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { adminApiFetch } from '@/lib/admin-api-client'
import { genderRestrictionLabel } from '@/lib/community-governance'

type CommunityMemberRow = {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  memberStatus?: string
  role?: string
}

export default function AdminCommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.id as string

  const [community, setCommunity] = React.useState<Community | null>(null)
  const [groups, setGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [members, setMembers] = React.useState<CommunityMemberRow[]>([])
  const [moderatingId, setModeratingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const unsubCommunity = subscribeToCommunity(communityId, (data) => {
      setCommunity(data)
      setLoading(false)
    })
    const unsubGroups = subscribeToCommunityGroups(communityId, setGroups)
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
    setModeratingId(member.id)
    try {
      const json = await adminApiFetch('/api/admin/community-members', {
        method: 'PATCH',
        body: JSON.stringify({
          communityId,
          memberDocId: member.id,
          userId: member.userId,
          action,
          reason: action === 'restore' ? undefined : prompt(`Reason for ${action}?`) || undefined,
          suspendDays: action === 'suspend' ? 7 : undefined,
        }),
      })
      if (!json.success) alert(json.error || 'Moderation action failed')
    } catch {
      alert('Moderation action failed')
    } finally {
      setModeratingId(null)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group?')) return
    try {
      await deleteGroup(communityId, groupId)
    } catch {
      alert('Failed to delete group')
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Community Details">
        <div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>
      </AdminPageLayout>
    )
  }

  if (!community) {
    return (
      <AdminPageLayout title="Community Not Found">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Community not found</p>
          <Link href="/admin/communities" className="px-4 py-2 bg-black text-white rounded-lg">
            Back to Communities
          </Link>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title={community.name} subtitle={`${groups.length} groups · ${community.memberCount} members`}>
      <div className="space-y-6">
        <Link href="/admin/communities" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ChevronLeft size={20} />
          Back to Communities
        </Link>

        {community.bannerURL && (
          <div
            className="w-full h-40 bg-gray-200 bg-cover bg-center rounded-lg"
            style={{ backgroundImage: `url(${community.bannerURL})` }}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black">{community.name}</h1>
            <p className="text-gray-600 mt-2">{community.description}</p>
          </div>
          <Link
            href={`/admin/communities/create?id=${communityId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            <Edit2 size={18} />
            Edit
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/communities/${communityId}/groups`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            <Layers size={18} />
            Manage Groups
          </Link>
          <Link
            href={`/admin/communities/${communityId}/groups/create`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-neutral-50"
          >
            <Plus size={18} />
            Create Group
          </Link>
          <Link
            href={`/communities/${communityId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-neutral-50"
          >
            View public page
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-black">Groups ({groups.length})</h2>
          {groups.length === 0 ? (
            <p className="text-gray-500 py-8 text-center bg-gray-50 rounded-lg">No groups yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-black">{group.name}</h3>
                    <span className="text-xs capitalize px-2 py-0.5 bg-gray-100 rounded">
                      {group.type?.replace('-', ' ') || 'discussion'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{group.description}</p>
                  <p className="text-xs text-gray-500">
                    {genderRestrictionLabel(group.genderRestriction)} · {group.memberCount} members
                    {group.requiresApproval ? ' · approval required' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/admin/communities/${communityId}/groups/${group.id}/edit`}
                      className="text-sm text-black underline flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      Edit
                    </Link>
                    <Link
                      href={`/communities/${communityId}/groups/${group.id}`}
                      className="text-sm text-black underline flex items-center gap-1"
                    >
                      <MessageCircle size={14} />
                      Open chat
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id!)}
                      className="text-sm text-red-700 flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <h2 className="text-xl font-bold text-black">Members ({members.length})</h2>
          </div>
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div>
                <p className="font-medium">{member.userName || 'Member'}</p>
                <p className="text-sm text-gray-500">{member.userEmail}</p>
              </div>
              <div className="flex gap-2">
                {member.memberStatus === 'active' ? (
                  <>
                    <button
                      type="button"
                      disabled={moderatingId === member.id}
                      onClick={() => handleModerateMember(member, 'suspend')}
                      className="px-3 py-1 text-sm border rounded-lg"
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      disabled={moderatingId === member.id}
                      onClick={() => handleModerateMember(member, 'ban')}
                      className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg"
                    >
                      Ban
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={moderatingId === member.id}
                    onClick={() => handleModerateMember(member, 'restore')}
                    className="px-3 py-1 text-sm border rounded-lg"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminPageLayout>
  )
}
