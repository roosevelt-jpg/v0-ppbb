'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getAllGroups } from '@/lib/community-service'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, Plus, MessageSquare, Search } from 'lucide-react'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'

interface Group {
  id: string
  name: string
  description: string
  type: string
  memberCount: number
  postCount: number
  coverImage?: string
}

function CommunityContent() {
  const router = useRouter()
  const { loading: authLoading } = useAuth()
  const [groups, setGroups] = React.useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedType, setSelectedType] = React.useState<string>('all')

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
        setGroups(result?.groups ?? [])
        setLoading(false)
      } catch (error) {
        console.error('[v0] Error loading groups:', error)
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  React.useEffect(() => {
    let filtered = groups

    if (searchTerm) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter((g) => g.type === selectedType)
    }

    setFilteredGroups(filtered)
  }, [searchTerm, selectedType, groups])

  if (authLoading || loading) return <DashboardSkeleton />

  return (
    <DashboardPageShell title="Community Forum" subtitle="Join discussions and connect with members">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard/community/create')}
          className="inline-flex items-center gap-2 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create New Group
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DashboardTabButton active={selectedType === 'all'} onClick={() => setSelectedType('all')}>
            All Types
          </DashboardTabButton>
          {groupTypes.map((type) => (
            <DashboardTabButton
              key={type.id}
              active={selectedType === type.id}
              onClick={() => setSelectedType(type.id)}
            >
              {type.label}
            </DashboardTabButton>
          ))}
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <DashboardEmptyState
          title="No groups found"
          description="No groups match your search. Create the first one."
          action={
            <button
              type="button"
              onClick={() => router.push('/dashboard/community/create')}
              className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Create First Group
            </button>
          }
        />
      ) : (
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

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/dashboard/community/${group.id}`)
                  }}
                  className="w-full !bg-black !text-white py-2 rounded-lg text-sm font-semibold"
                >
                  View Group
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardPageShell>
  )
}

export default function CommunityPage() {
  return <CommunityContent />
}
