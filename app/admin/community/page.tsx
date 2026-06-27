'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Plus, Trash2, Edit2 } from 'lucide-react'

export default function AdminCommunityPage() {
  const [activeTab, setActiveTab] = React.useState<'stats' | 'groups' | 'activities'>('stats')
  const [stats, setStats] = React.useState<any>(null)
  const [groups, setGroups] = React.useState<any[]>([])
  const [activities, setActivities] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadCommunityData()
  }, [activeTab])

  const loadCommunityData = async () => {
    try {
      if (activeTab === 'stats') {
        const res = await fetch('/api/community?query=stats', { cache: 'no-store' })
        const json = await res.json()
        if (json.success) setStats(json.data)
      } else if (activeTab === 'groups') {
        const res = await fetch('/api/community?query=groups', { cache: 'no-store' })
        const json = await res.json()
        if (json.success) setGroups(json.data)
      } else if (activeTab === 'activities') {
        const res = await fetch('/api/community?query=activities', { cache: 'no-store' })
        const json = await res.json()
        if (json.success) setActivities(json.data)
      }
    } catch (error) {
      console.error('[v0] Error loading community data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`/api/community?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setGroups(groups.filter(g => g.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting group:', error)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Community">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading community data...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Community">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Community Management</h2>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {['stats', 'groups', 'activities'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any)
                setLoading(true)
              }}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Community Members</p>
              <p className="text-3xl font-bold text-black">{stats.totalMembers}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Published Events</p>
              <p className="text-3xl font-bold text-black">{stats.publishedEvents}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Active Volunteers</p>
              <p className="text-3xl font-bold text-black">{stats.volunteers}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Donations Tracked</p>
              <p className="text-3xl font-bold text-black">AED {stats.donations?.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">{groups.length} groups</p>
              <Link
                href="/admin/community/create-group"
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
              >
                <Plus size={18} />
                Create Group
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No groups created yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group: any) => (
                  <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-600">{group.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{group.members?.length || 0} members</p>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{activities.length} recent activities</p>

            {activities.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No activities recorded yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Activity</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activities.map((activity: any) => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-900">{activity.description}</td>
                        <td className="px-6 py-3 text-gray-600 capitalize">{activity.type}</td>
                        <td className="px-6 py-3 text-gray-600">{new Date(activity.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
