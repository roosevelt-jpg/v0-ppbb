'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Plus, Trash2, Edit2, Users } from 'lucide-react'
import Link from 'next/link'

export default function CommunityGroupsPage() {
  const params = useParams()
  const router = useRouter()
  const communityId = params.id as string

  const [groups, setGroups] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchGroups = async () => {
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
    }

    fetchGroups()
  }, [communityId])

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/groups/${groupId}?communityId=${communityId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setGroups(groups.filter(g => g.id !== groupId))
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
    <AdminPageLayout title="Community Groups">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Groups</h2>
          <Link
            href={`/admin/communities/${communityId}/groups/create`}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
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
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {group.memberCount} members
                    </span>
                    <span className="capitalize px-2 py-1 bg-gray-100 rounded">
                      {group.genderRestriction === 'male' && 'Men Only'}
                      {group.genderRestriction === 'female' && 'Women Only'}
                      {group.genderRestriction === 'mixed' && 'All'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/communities/${communityId}/groups/${group.id}/edit`}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                    title="Edit group"
                  >
                    <Edit2 size={18} />
                  </Link>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete group"
                  >
                    <Trash2 size={18} />
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
