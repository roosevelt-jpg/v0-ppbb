'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Edit2, Archive, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    let q = query(collection(db, 'communities'), where('status', '==', 'active'), orderBy('createdAt', 'desc'))

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

  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'general', 'interest', 'support', 'events', 'volunteer', 'business', 'charity']

  const handleArchive = async (communityId: string) => {
    if (!confirm('Archive this community?')) return
    try {
      const res = await fetch(`/api/communities?id=${communityId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to archive')
      console.log('[v0] Community archived')
    } catch (error) {
      console.error('[v0] Error archiving community:', error)
      alert('Failed to archive community')
    }
  }

  return (
    <AdminPageLayout title="Communities" subtitle="Manage communities and their groups">
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500"
            />
          </div>
          <Link
            href="/admin/communities/create"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            <Plus className="w-4 h-4" />
            Create Community
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

        {/* Communities List */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading communities...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No communities found</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(community => (
              <div key={community.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-black mb-2">{community.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{community.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {community.category}
                      </span>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {community.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <Users className="w-3 h-3" />
                        {community.members?.total || 1}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      Created {formatDistanceToNow(community.createdAt, { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/communities/${community.id}`}
                      className="p-2 hover:bg-gray-100 rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5 text-black" />
                    </Link>
                    <button
                      onClick={() => handleArchive(community.id)}
                      className="p-2 hover:bg-red-50 rounded transition"
                      title="Archive"
                    >
                      <Archive className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
