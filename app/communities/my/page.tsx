'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Users, Tag, ChevronRight, LogOut } from 'lucide-react'

export default function MyCommunitiesPage() {
  const { user } = useAuth()
  const [communities, setCommunities] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [leavingId, setLeavingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user) return

    const fetchMyCommunities = async () => {
      try {
        const commRef = collection(db, 'communities')
        const q = query(commRef, where('status', '==', 'active'))
        const snapshot = await getDocs(q)

        const allCommunities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Check which ones user is a member of
        const userCommunities = []
        for (const community of allCommunities) {
          const membersRef = collection(db, `communities/${community.id}/members`)
          const memberQuery = query(membersRef, where('userId', '==', user.id))
          const memberSnapshot = await getDocs(memberQuery)

          if (!memberSnapshot.empty) {
            userCommunities.push(community)
          }
        }

        setCommunities(userCommunities)
        setLoading(false)
      } catch (error) {
        console.error('[v0] Error fetching communities:', error)
        setLoading(false)
      }
    }

    fetchMyCommunities()
  }, [user])

  const handleLeaveCommunity = async (communityId: string) => {
    if (!confirm('Leave this community? You can rejoin anytime.')) return

    setLeavingId(communityId)
    try {
      const res = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })

      const data = await res.json()
      if (data.success) {
        setCommunities(communities.filter(c => c.id !== communityId))
      } else {
        alert('Failed to leave community')
      }
    } catch (error) {
      console.error('[v0] Error leaving community:', error)
      alert('Failed to leave community')
    } finally {
      setLeavingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">My Communities</h1>
          <p className="text-gray-600">Communities you've joined and participate in</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading your communities...</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg mb-6">You haven't joined any communities yet</p>
            <Link
              href="/communities"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
            >
              Explore Communities
              <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                    href={`/communities/${community.id}`}
                    className="block group"
                  >
                    <h3 className="font-bold text-black text-lg group-hover:text-blue-600 transition-colors">
                      {community.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {community.description}
                  </p>

                  {/* Tags */}
                  {community.tags && community.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {community.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                        >
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      {community.memberCount} members
                    </div>
                    <span className="text-xs">{community.groupCount} groups</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/communities/${community.id}`}
                      className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium text-center text-sm transition-colors"
                    >
                      View Community
                    </Link>
                    <button
                      onClick={() => handleLeaveCommunity(community.id)}
                      disabled={leavingId === community.id}
                      className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <LogOut size={16} />
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
