'use client'

import React from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Users, MessageSquare, Flag, TrendingUp, Activity, Zap, Heart, Share2 } from 'lucide-react'

export default function CommunityStatsPage() {
  const [stats, setStats] = React.useState({
    totalGroups: 0,
    totalMembers: 0,
    totalPosts: 0,
    totalComments: 0,
    pendingFlags: 0,
    activeGroups: 0,
    totalLikes: 0,
    totalShares: 0,
  })
  const [topGroups, setTopGroups] = React.useState<any[]>([])
  const [recentActivity, setRecentActivity] = React.useState<any[]>([])
  const [memberEngagement, setMemberEngagement] = React.useState({
    veryActive: 0,
    active: 0,
    inactive: 0,
  })

  // Load groups and stats
  React.useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'groups')), (snapshot) => {
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[]
      
      const activeCount = groups.filter((g) => g.isActive).length
      const totalMembers = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0)
      const totalPosts = groups.reduce((sum, g) => sum + (g.postCount || 0), 0)
      const totalComments = groups.reduce((sum, g) => sum + (g.commentCount || 0), 0)
      const totalLikes = groups.reduce((sum, g) => sum + (g.likeCount || 0), 0)
      const totalShares = groups.reduce((sum, g) => sum + (g.shareCount || 0), 0)

      // Get top groups by member count
      const sorted = [...groups].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      setTopGroups(sorted.slice(0, 5))

      setStats((prev) => ({
        ...prev,
        totalGroups: snapshot.docs.length,
        activeGroups: activeCount,
        totalMembers,
        totalPosts,
        totalComments,
        totalLikes,
        totalShares,
      }))
    })

    return () => unsubscribe()
  }, [])

  // Load flags
  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'communityReports'), where('status', '==', 'pending')),
      (snapshot) => {
        setStats((prev) => ({
          ...prev,
          pendingFlags: snapshot.docs.length,
        }))
      }
    )

    return () => unsubscribe()
  }, [])

  // Load member engagement stats
  React.useEffect(() => {
    const fetchMemberEngagement = async () => {
      try {
        const allPosts = await getDocs(collection(db, 'posts'))
        const memberPostCounts: { [key: string]: number } = {}
        
        allPosts.docs.forEach(doc => {
          const data = doc.data()
          const authorId = data.authorId
          memberPostCounts[authorId] = (memberPostCounts[authorId] || 0) + 1
        })

        let veryActive = 0
        let active = 0
        let inactive = 0

        Object.values(memberPostCounts).forEach(count => {
          if (count >= 10) veryActive++
          else if (count >= 3) active++
          else inactive++
        })

        setMemberEngagement({ veryActive, active, inactive })
      } catch (error) {
        console.error('[v0] Error fetching member engagement:', error)
      }
    }

    fetchMemberEngagement()
  }, [])

  const engagementRate = stats.totalMembers > 0 
    ? Math.round(((memberEngagement.veryActive + memberEngagement.active) / stats.totalMembers) * 100)
    : 0

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Community Forum Analytics</h1>
          <p className="text-neutral-600 mt-1">Real-time community engagement and growth metrics</p>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Groups</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalGroups}</p>
                <p className="text-xs text-green-600 mt-2">{stats.activeGroups} active</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Members</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalMembers}</p>
                <p className="text-xs text-neutral-500 mt-2">Community size</p>
              </div>
              <Users className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Posts</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalPosts}</p>
                <p className="text-xs text-neutral-500 mt-2">Discussions</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.pendingFlags}</p>
                <p className="text-xs text-red-500 mt-2">Flagged items</p>
              </div>
              <Flag className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Comments</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.totalComments}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Likes</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.totalLikes}</p>
              </div>
              <Heart className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Shares</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.totalShares}</p>
              </div>
              <Share2 className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Engagement Rate</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">{engagementRate}%</p>
                <p className="text-xs text-neutral-500 mt-1">Active members</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Groups */}
          <Card className="p-6 border border-neutral-200 lg:col-span-2">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Top Groups by Members</h2>
            {topGroups.length === 0 ? (
              <p className="text-neutral-600 text-sm">No groups yet</p>
            ) : (
              <div className="space-y-3">
                {topGroups.map((group, idx) => (
                  <div key={group.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{group.name}</p>
                        <p className="text-xs text-neutral-600">{group.description?.substring(0, 40)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">{group.memberCount || 0}</p>
                      <p className="text-xs text-neutral-600">members</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Member Engagement Breakdown */}
          <Card className="p-6 border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Member Activity Levels</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-700">Very Active</span>
                  <span className="text-lg font-bold text-green-600">{memberEngagement.veryActive}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${stats.totalMembers > 0 ? (memberEngagement.veryActive / stats.totalMembers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-700">Active</span>
                  <span className="text-lg font-bold text-blue-600">{memberEngagement.active}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${stats.totalMembers > 0 ? (memberEngagement.active / stats.totalMembers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-700">Inactive</span>
                  <span className="text-lg font-bold text-gray-500">{memberEngagement.inactive}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full" 
                    style={{ width: `${stats.totalMembers > 0 ? (memberEngagement.inactive / stats.totalMembers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="p-6 border border-neutral-200 mt-8">
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Community Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-neutral-600">Avg Members/Group</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.totalGroups > 0 ? Math.round(stats.totalMembers / stats.totalGroups) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Avg Posts/Group</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.totalGroups > 0 ? Math.round(stats.totalPosts / stats.totalGroups) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Avg Comments/Post</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.totalPosts > 0 ? Math.round(stats.totalComments / stats.totalPosts) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Active Groups Rate</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.totalGroups > 0 ? Math.round((stats.activeGroups / stats.totalGroups) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
