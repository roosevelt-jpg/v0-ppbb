'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Recording } from '@/lib/types'
import { Play, Eye, Heart, Search } from 'lucide-react'

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'recordings'), where('status', '==', 'published')),
      (snapshot) => {
        setRecordings(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        } as Recording)))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const categories = ['all', ...new Set(recordings.map(r => r.category))]
  const filtered = recordings.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f6f2' }}>
      {/* Header */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 border-b" style={{ backgroundColor: '#111111', borderColor: '#333333' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold" style={{ color: '#ffffff' }}>Educational Recordings</h1>
          <p className="mt-2" style={{ color: '#888888' }}>Learn at your own pace with on-demand video content</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5" style={{ color: '#888888' }} />
              <input
                type="text"
                placeholder="Search recordings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{
                  borderColor: '#e4e1da',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                }}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  style={{
                    backgroundColor: selectedCategory === cat ? '#111111' : '#ffffff',
                    color: selectedCategory === cat ? '#f7f6f2' : '#111111',
                    border: `1px solid ${selectedCategory === cat ? '#111111' : '#e4e1da'}`,
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: '#888888' }}>Loading recordings...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: '#888888' }}>No recordings found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(recording => (
                <a
                  key={recording.id}
                  href={recording.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 cursor-pointer group"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da' }}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden h-40 bg-neutral-200">
                    {recording.thumbnail ? (
                      <img
                        src={recording.thumbnail}
                        alt={recording.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-4xl"
                        style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
                      >
                        <Play className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-12 w-12" style={{ color: '#ffffff' }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <h3 style={{ color: '#111111' }} className="font-bold text-lg line-clamp-2">{recording.title}</h3>
                    <p style={{ color: '#888888' }} className="text-sm line-clamp-2">{recording.description}</p>

                    <div style={{ color: '#999999' }} className="text-sm">
                      <strong>Instructor:</strong> {recording.instructor}
                    </div>

                    {recording.tags && recording.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {recording.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#f7f6f2', color: '#111111' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm pt-4 border-t" style={{ borderColor: '#e4e1da', color: '#888888' }}>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {recording.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {recording.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {Math.floor(recording.duration / 60)}m
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
