'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Play, Headphones, Calendar, User, Filter } from 'lucide-react'
import { format } from 'date-fns'

interface Recording {
  id: string
  title: string
  description: string
  type: 'audio' | 'video'
  url: string
  thumbnailUrl?: string
  duration?: number
  speaker?: string
  date: string
  status: string
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'video'>('all')

  useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    try {
      const res = await fetch('/api/recordings?status=published', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setRecordings(json.data)
      }
    } catch (error) {
      console.error('[v0] Error loading recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecordings = recordings.filter(r => 
    filterType === 'all' ? true : r.type === filterType
  )

  const audioCount = recordings.filter(r => r.type === 'audio').length
  const videoCount = recordings.filter(r => r.type === 'video').length

  const RecordingCard = ({ recording }: { recording: Recording }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Thumbnail/Player Preview */}
      <div className="relative h-40 bg-gray-900 flex items-center justify-center overflow-hidden">
        {recording.type === 'video' && recording.thumbnailUrl ? (
          <img
            src={recording.thumbnailUrl}
            alt={recording.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            {recording.type === 'audio' ? (
              <Headphones size={48} className="text-gray-400" />
            ) : (
              <Play size={48} className="text-gray-400" />
            )}
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
          <a
            href={recording.url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {recording.type === 'audio' ? (
              <Headphones size={40} className="text-white" />
            ) : (
              <Play size={40} className="text-white fill-white" />
            )}
          </a>
        </div>

        {/* Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
            recording.type === 'audio' ? 'bg-blue-600' : 'bg-red-600'
          }`}>
            {recording.type === 'audio' ? 'Audio' : 'Video'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-black mb-2 line-clamp-2">{recording.title}</h3>

        <div className="space-y-2 mb-4 text-sm text-gray-600">
          {recording.speaker && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-black" />
              <span>{recording.speaker}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-black" />
            <span>{format(new Date(recording.date), 'MMM dd, yyyy')}</span>
          </div>

          {recording.duration && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⏱️</span>
              <span>{Math.floor(recording.duration / 60)} min</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{recording.description}</p>

        <a
          href={recording.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
        >
          {recording.type === 'audio' ? (
            <>
              <Headphones size={16} />
              Listen
            </>
          ) : (
            <>
              <Play size={16} className="fill-current" />
              Watch
            </>
          )}
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Event Recordings</h1>
          <p className="text-gray-300 text-lg">Explore our library of recorded events, workshops, and presentations</p>
        </div>
      </section>

      {/* Filter */}
      <section className="border-b border-gray-200 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter size={20} className="text-gray-600" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({recordings.length})
            </button>
            <button
              onClick={() => setFilterType('audio')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filterType === 'audio'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Headphones size={16} />
              Audio ({audioCount})
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filterType === 'video'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Play size={16} className="fill-current" />
              Video ({videoCount})
            </button>
          </div>
        </div>
      </section>

      {/* Recordings Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading recordings...</p>
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No recordings found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecordings.map(recording => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
