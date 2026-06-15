'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { getAllGroups, getGroupsByType } from '@/lib/community-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, MessageSquare, Search, Filter } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string
  type: string
  memberCount: number
  postCount: number
  coverImage?: string
}

export default function CommunityPage() {
  const router = useRouter()
  const [groups, setGroups] = React.useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedType, setSelectedType] = React.useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [userGroups, setUserGroups] = React.useState<Set<string>>(new Set())

  const groupTypes = [
    { id: 'member_networking', label: 'Member Networking' },
    { id: 'cause_discussion', label: 'Cause Discussions' },
    { id: 'business_networking', label: 'Business Networking' },
    { id: 'volunteer_coordination', label: 'Volunteer Coordination' },
  ]

  // Load all groups
  React.useEffect(() => {
    const loadGroups = async () => {
      try {
        const result = await getAllGroups(50)
        setGroups(result.groups)
        setFilteredGroups(result.groups)
        setLoading(false)
      } catch (error) {
        console.error('[v0] Error loading groups:', error)
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  // Load user's groups
  React.useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'groups'), where('memberCount', '>', 0)),
      (snapshot) => {
        const userGroupIds = new Set<string>()
        // This is a simplified check - in production you'd check membership collection
        setUserGroups(userGroupIds)
      }
    )

    return () => unsubscribe()
  }, [])

  // Filter groups
  React.useEffect(() => {
    let filtered = groups

    if (searchTerm) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType) {
      filtered = filtered.filter((g) => g.type === selectedType)
    }

    setFilteredGroups(filtered)
  }, [searchTerm, selectedType, groups])

  return (
    <div className="flex min-h-screen bg-gray-50">
            <div className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
          <p className="text-gray-600">Join discussions, share ideas, and connect with members</p>
        </div>

        {/* Create Group Button */}
        <div className="mb-6">
          <Button onClick={() => router.push('/dashboard/community/create')} className="bg-black hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Create New Group
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedType === null ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              All Types
            </button>
            {groupTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedType === type.id ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Groups Grid */}
        {!loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="overflow-hidden hover:shadow-lg transition cursor-pointer"
                onClick={() => router.push(`/dashboard/community/${group.id}`)}
              >
                {/* Cover Image */}
                {group.coverImage && (
                  <div className="h-40 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden">
                    <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{group.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{group.postCount} posts</span>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-black">
                      {groupTypes.find((t) => t.id === group.type)?.label}
                    </span>
                  </div>

                  {/* Join Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/community/${group.id}`)
                    }}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                  >
                    {userGroups.has(group.id) ? 'View Group' : 'Join Group'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="animate-pulse">Loading groups...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGroups.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">No groups found matching your criteria.</p>
            <Button onClick={() => router.push('/dashboard/community/create')} className="bg-black hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Create First Group
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
