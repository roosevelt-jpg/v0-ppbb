'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Plus, Trash2, Edit2, Users, Tag } from 'lucide-react'
import { subscribeToAllCommunities, deleteCommunity } from '@/lib/community-queries'
import type { Community } from '@/lib/community-types'
import { format } from 'date-fns'

type Tab = 'communities' | 'groups' | 'stats'

export default function AdminCommunityPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('communities')
  const [communities, setCommunities] = React.useState<Community[]>([])
  const [stats, setStats] = React.useState({ totalMembers: 0, totalCommunities: 0, totalGroups: 0 })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToAllCommunities((data) => {
      setCommunities(data)
      
      // Calculate stats
      const totalMembers = data.reduce((sum, c) => sum + (c.memberCount || 0), 0)
      const totalGroups = data.reduce((sum, c) => sum + (c.groupCount || 0), 0)
      setStats({
        totalMembers,
        totalCommunities: data.length,
        totalGroups,
      })
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleDelete = async (communityId: string) => {
    if (!confirm('Delete this community? This action cannot be undone.')) return
    try {
      await deleteCommunity(communityId)
    } catch (error) {
      console.error('[v0] Error deleting community:', error)
      alert('Failed to delete community')
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Community Management">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading communities...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Community Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Community Management</h2>
          <Link
            href="/admin/community/create"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
          >
            <Plus size={20} />
            Create Community
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
          {(['communities', 'groups', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-black text-white border-b-2 border-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'communities' && `Communities (${communities.length})`}
              {tab === 'groups' && `Groups (${stats.totalGroups})`}
              {tab === 'stats' && 'Statistics'}
            </button>
          ))}
        </div>

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div className="space-y-4">
            {communities.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No communities created yet.</p>
                <Link
                  href="/admin/community/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                >
                  <Plus size={18} />
                  Create First Community
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Banner */}
                    {community.bannerURL && (
                      <div
                        className="w-full h-32 bg-gray-200 bg-cover bg-center"
                        style={{ backgroundImage: `url(${community.bannerURL})` }}
                      />
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <Link
                        href={`/admin/community/${community.id}`}
                        className="block group"
                      >
                        <h3 className="font-bold text-black group-hover:text-blue-600 text-lg">
                          {community.name}
                        </h3>
                      </Link>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {community.description}
                      </p>

                      {/* Tags */}
                      {community.tags && community.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {community.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                            >
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                          {community.tags.length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{community.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Users size={14} />
                          {community.memberCount} members
                        </div>
                        <div className="text-xs text-gray-600">
                          {community.groupCount} groups
                        </div>
                      </div>

                      {/* Gender Restriction */}
                      <div className="text-xs text-gray-500">
                        {community.genderRestriction === 'mixed'
                          ? 'Open to all'
                          : community.genderRestriction === 'men-only'
                          ? 'Men only'
                          : 'Ladies only'}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Link
                          href={`/admin/community/${community.id}`}
                          className="flex-1 px-3 py-1 bg-gray-100 text-gray-900 rounded hover:bg-gray-200 text-xs font-medium text-center"
                        >
                          <Edit2 className="inline mr-1" size={12} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(community.id!)}
                          className="flex-1 px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs font-medium"
                        >
                          <Trash2 className="inline mr-1" size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">Manage groups from individual community pages.</p>
              <Link
                href="/admin/community"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
              >
                Go to Communities
              </Link>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Total Communities</p>
              <p className="text-4xl font-bold text-black">{stats.totalCommunities}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Total Members</p>
              <p className="text-4xl font-bold text-black">{stats.totalMembers}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Total Groups</p>
              <p className="text-4xl font-bold text-black">{stats.totalGroups}</p>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
