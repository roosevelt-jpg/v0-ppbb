'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Workshop } from '@/lib/types'
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'workshops'), where('status', '==', 'published')),
      (snapshot) => {
        setWorkshops(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || new Date(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        } as Workshop)))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const upcomingWorkshops = workshops.filter(w => w.date > new Date())
  const pastWorkshops = workshops.filter(w => w.date <= new Date())

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f6f2' }}>
      {/* Header */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 border-b" style={{ backgroundColor: '#111111', borderColor: '#333333' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold" style={{ color: '#ffffff' }}>Educational Workshops</h1>
          <p className="mt-2" style={{ color: '#888888' }}>Learn, grow, and develop new skills with our community workshops</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: '#888888' }}>Loading workshops...</p>
            </div>
          ) : upcomingWorkshops.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: '#888888' }}>No upcoming workshops at the moment.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-8" style={{ color: '#111111' }}>Upcoming Workshops</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {upcomingWorkshops.map(workshop => (
                  <div
                    key={workshop.id}
                    className="rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: '#ffffff', borderTop: '4px solid #111111' }}
                  >
                    <div className="p-6 space-y-4">
                      <h3 style={{ color: '#111111' }} className="text-xl font-bold">{workshop.title}</h3>
                      <p style={{ color: '#888888' }} className="text-sm">{workshop.description}</p>

                      <div className="space-y-3 py-4 border-t border-b" style={{ borderColor: '#e4e1da' }}>
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                          <Calendar className="h-4 w-4" />
                          {workshop.date.toLocaleDateString()} at {workshop.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                          <Clock className="h-4 w-4" />
                          {workshop.duration} minutes
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                          <MapPin className="h-4 w-4" />
                          {workshop.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                          <Users className="h-4 w-4" />
                          {workshop.registered}/{workshop.capacity} registered
                        </div>
                      </div>

                      <div style={{ color: '#999999' }} className="text-sm">
                        <strong>Instructor:</strong> {workshop.instructorName}
                      </div>

                      <button
                        className="w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333333')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
                      >
                        Register Now
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {pastWorkshops.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-8" style={{ color: '#111111' }}>Past Workshops</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastWorkshops.map(workshop => (
                  <div
                    key={workshop.id}
                    className="rounded-lg overflow-hidden shadow"
                    style={{ backgroundColor: '#ffffff', opacity: 0.7 }}
                  >
                    <div className="p-6">
                      <h3 style={{ color: '#111111' }} className="text-lg font-bold mb-2">{workshop.title}</h3>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#999999' }}>
                        <Calendar className="h-4 w-4" />
                        {workshop.date.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
