'use client'

import React from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Users, MessageSquare, Flag, TrendingUp } from 'lucide-react'

export default function CommunityStatsPage() {
  const [stats, setStats] = React.useState({
    totalGroups: 0,
    totalMembers: 0,
    totalPosts: 0,
    pendingFlags: 0,
    activeGroups: 0,
  })

  // Load groups
  React.useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'groups')), (snapshot) => {
      const groups = snapshot.docs.map((doc) => doc.data() as any)
      const activeCount = groups.filter((g) => g.isActive).length
      const totalMembers = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0)
      const totalPosts = groups.reduce((sum, g) => sum + (g.postCount || 0), 0)

      setStats((prev) => ({
        ...prev,
        totalGroups: snapshot.docs.length,
        activeGroups: activeCount,
        totalMembers,
        totalPosts,
      }))
    })

    return () => unsubscribe()
  }, [])

  // Load flags
  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'communityModeration'), where('status', '==', 'pending')),
      (snapshot) => {
        setStats((prev) => ({
          ...prev,
          pendingFlags: snapshot.docs.length,
        }))
      }
    )

    return () => unsubscribe()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Community Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Groups</p>
              <p className="text-3xl font-bold">{stats.totalGroups}</p>
              <p className="text-xs text-green-600 mt-1">{stats.activeGroups} active</p>
            </div>
            <MessageSquare className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Members</p>
              <p className="text-3xl font-bold">{stats.totalMembers}</p>
              <p className="text-xs text-gray-500 mt-1">Across all</p>
            </div>
            <Users className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Posts</p>
              <p className="text-3xl font-bold">{stats.totalPosts}</p>
              <p className="text-xs text-gray-500 mt-1">Discussions</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-red-600">{stats.pendingFlags}</p>
              <p className="text-xs text-red-500 mt-1">Flagged content</p>
            </div>
            <Flag className="w-10 h-10 text-red-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg/Group</p>
              <p className="text-3xl font-bold">
                {stats.totalGroups > 0 ? Math.round(stats.totalMembers / stats.totalGroups) : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Members</p>
            </div>
            <Users className="w-10 h-10 text-orange-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg/Group</p>
              <p className="text-3xl font-bold">
                {stats.totalGroups > 0 ? Math.round(stats.totalPosts / stats.totalGroups) : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Posts</p>
            </div>
            <MessageSquare className="w-10 h-10 text-indigo-500 opacity-20" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-4">Summary</h2>
        <p className="text-sm text-gray-600">
          Your community has <strong>{stats.totalGroups}</strong> groups with <strong>{stats.totalMembers}</strong> members
          engaging in <strong>{stats.totalPosts}</strong> discussions.
          {stats.pendingFlags > 0 && (
            <span className="text-red-600 ml-2">
              <strong>{stats.pendingFlags}</strong> flagged items await review.
            </span>
          )}
        </p>
      </Card>
    </div>
  )
}
