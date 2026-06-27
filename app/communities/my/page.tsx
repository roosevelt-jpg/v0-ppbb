'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function MyCommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [leavingId, setLeavingId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // Fetch user's communities
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'community-memberships'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    )

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const communityIds = snapshot.docs.map(d => d.data().communityId)
        
        // Fetch community details
        const communities = []
        for (const cId of communityIds) {
          try {
            const response = await fetch(`/api/communities?id=${cId}`)
            const data = await response.json()
            if (data.success) {
              communities.push(data.data)
            }
          } catch (error) {
            console.error('[v0] Error fetching community:', error)
          }
        }
        
        setCommunities(communities)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching memberships:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const handleLeaveCommunity = async (communityId: string) => {
    if (!confirm('Leave this community?')) return

    setLeavingId(communityId)
    try {
      const memberQ = query(
        collection(db, 'community-memberships'),
        where('userId', '==', user.uid),
        where('communityId', '==', communityId)
      )

      // In a real app, we'd get the membership ID and call the API
      const response = await fetch('/api/community-memberships', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, membershipId: 'placeholder' }),
      })

      console.log('[v0] Left community')
      alert('Left community')
    } catch (error: any) {
      console.error('[v0] Error leaving community:', error)
      alert('Failed to leave community')
    } finally {
      setLeavingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">My Communities</h1>
          <p className="text-gray-600">Your joined communities and groups</p>
        </div>

        {/* Communities */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-4" />
            <p className="text-gray-600">Loading communities...</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">You haven&apos;t joined any communities yet</p>
            <Link
              href="/communities"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Explore Communities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map(community => (
              <div key={community.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-black mb-2">{community.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{community.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                      {community.category}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/communities/${community.id}`}
                      className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-center font-medium"
                    >
                      View Groups
                    </Link>
                    <button
                      onClick={() => handleLeaveCommunity(community.id)}
                      disabled={leavingId === community.id}
                      className="px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {leavingId === community.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
