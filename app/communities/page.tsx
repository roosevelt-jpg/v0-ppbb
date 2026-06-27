'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Users, BookOpen, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function CommunitiesDiscoveryPage() {
  const [communities, setCommunities] = useState<any[]>([])
  const [userCommunities, setUserCommunities] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [user, setUser] = useState<any>(null)

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(d => d.data().communityId))
      setUserCommunities(ids)
    })

    return () => unsubscribe()
  }, [user])

  // Fetch all public communities
  useEffect(() => {
    const q = query(
      collection(db, 'communities'),
      where('visibility', '==', 'public'),
      where('status', '==', 'active')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }))
        setCommunities(data)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching communities:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      alert('Please log in to join communities')
      return
    }

    setJoiningId(communityId)
    try {
      const response = await fetch('/api/community-memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          communityId,
          role: 'member',
        }),
      })

      const data = await response.json()
      if (data.success) {
        console.log('[v0] Joined community:', communityId)
        alert('Joined community!')
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('[v0] Error joining community:', error)
      alert(`Failed to join: ${error.message}`)
    } finally {
      setJoiningId(null)
    }
  }

  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'general', 'interest', 'support', 'events', 'volunteer', 'business', 'charity']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Communities</h1>
          <p className="text-gray-600">Discover and join communities to connect with others</p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500"
            />
            <Link
              href="/communities/my"
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium whitespace-nowrap text-center"
            >
              My Communities
            </Link>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition text-sm font-medium ${
                  categoryFilter === cat
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-4" />
            <p className="text-gray-600">Loading communities...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No communities found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(community => {
              const isJoined = userCommunities.has(community.id)
              return (
                <div key={community.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-black mb-2">{community.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{community.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {community.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <Users className="w-3 h-3" />
                        {community.members?.total || 1}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Created {formatDistanceToNow(community.createdAt, { addSuffix: true })}
                    </p>

                    {isJoined ? (
                      <Link
                        href={`/communities/${community.id}`}
                        className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-center font-medium"
                      >
                        View Community
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleJoinCommunity(community.id)}
                        disabled={joiningId === community.id}
                        className="w-full px-4 py-2 border border-black text-black rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                      >
                        {joiningId === community.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Joining...
                          </span>
                        ) : (
                          'Join Community'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
