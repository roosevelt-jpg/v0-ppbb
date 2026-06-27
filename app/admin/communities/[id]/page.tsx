'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CommunityDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const communityId = params.id as string

  const [community, setCommunity] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!communityId) return

    // Fetch community
    const fetchCommunity = async () => {
      try {
        const response = await fetch(`/api/communities?id=${communityId}`)
        const data = await response.json()
        if (data.success) {
          setCommunity(data.data)
        }
      } catch (error) {
        console.error('[v0] Error fetching community:', error)
      }
    }

    fetchCommunity()

    // Subscribe to groups
    const q = query(collection(db, 'community-groups'), where('communityId', '==', communityId), where('status', '==', 'active'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }))
      setGroups(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [communityId])

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) {
      alert('Group name is required')
      return
    }

    try {
      console.log('[v0] Creating group:', { name: newGroupName, communityId })

      const response = await fetch('/api/community-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId,
          name: newGroupName,
          description: newGroupDescription,
          createdBy: user.uid,
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      console.log('[v0] Group created successfully')
      setNewGroupName('')
      setNewGroupDescription('')
      setShowCreateGroup(false)
      alert('Group created successfully!')
    } catch (error: any) {
      console.error('[v0] Error creating group:', error)
      alert(`Failed to create group: ${error.message}`)
    }
  }

  if (!community) {
    return <AdminPageLayout title="Loading..." subtitle="" ><div className="text-center py-12">Loading community...</div></AdminPageLayout>
  }

  return (
    <AdminPageLayout 
      title={community.name} 
      subtitle={`${groups.length} groups • ${community.members?.total || 1} members`}
    >
      <div className="space-y-6">
        {/* Community Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-2 text-black">Community Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-medium text-black capitalize">{community.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Visibility</p>
              <p className="font-medium text-black capitalize">{community.visibility}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="font-medium text-black">{community.members?.total || 1}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium text-black">{formatDistanceToNow(community.createdAt, { addSuffix: true })}</p>
            </div>
          </div>
          {community.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium text-black">{community.description}</p>
            </div>
          )}
        </div>

        {/* Groups Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-black">Groups</h3>
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              <Plus className="w-4 h-4" />
              New Group
            </button>
          </div>

          {showCreateGroup && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Developers"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Description</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Group description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No groups yet. Create one to get started!</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {groups.map(group => (
                <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-black mb-1">{group.name}</h4>
                      {group.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.members?.total || 1} members
                        </span>
                        <span>Created {formatDistanceToNow(group.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded transition">
                        <Edit2 className="w-4 h-4 text-black" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}
