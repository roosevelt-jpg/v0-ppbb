'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

interface Workshop {
  id: string
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  instructor?: string
  location?: { address: string; city: string }
  bannerImageUrl?: string
  maxCapacity?: number
  status: string
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkshops()
  }, [])

  const loadWorkshops = async () => {
    try {
      const res = await fetch('/api/workshops?status=published', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setWorkshops(json.data)
      }
    } catch (error) {
      console.error('[v0] Error loading workshops:', error)
    } finally {
      setLoading(false)
    }
  }

  const upcomingWorkshops = workshops.filter(w => new Date(w.date) > new Date())
  const pastWorkshops = workshops.filter(w => new Date(w.date) <= new Date())

  const WorkshopCard = ({ workshop }: { workshop: Workshop }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {workshop.bannerImageUrl && (
        <div className="h-40 overflow-hidden bg-gray-100">
          <img
            src={workshop.bannerImageUrl}
            alt={workshop.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-black mb-2 line-clamp-2">{workshop.title}</h3>

        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-black" />
            <span>{format(new Date(workshop.date), 'MMM dd, yyyy')}</span>
          </div>

          {workshop.startTime && (
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-black" />
              <span>
                {workshop.startTime}
                {workshop.endTime && ` - ${workshop.endTime}`}
              </span>
            </div>
          )}

          {workshop.instructor && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">👨‍🏫</span>
              <span>{workshop.instructor}</span>
            </div>
          )}

          {workshop.location?.address && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-black" />
              <span>{workshop.location.address}</span>
            </div>
          )}

          {workshop.maxCapacity && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-black" />
              <span>Capacity: {workshop.maxCapacity}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{workshop.description}</p>

        <Link
          href={`/workshops/${workshop.id}`}
          className="inline-flex items-center gap-2 text-black font-medium hover:gap-3 transition-all"
        >
          View Details <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#111111] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Educational Workshops</h1>
          <p className="text-gray-300 text-lg">Learn, grow, and develop new skills with our community workshops</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading workshops...</p>
            </div>
          ) : (
            <>
              {upcomingWorkshops.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-black mb-8">Upcoming Workshops</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingWorkshops.map(workshop => (
                      <WorkshopCard key={workshop.id} workshop={workshop} />
                    ))}
                  </div>
                </div>
              )}

              {pastWorkshops.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-black mb-8">Past Workshops</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                    {pastWorkshops.map(workshop => (
                      <WorkshopCard key={workshop.id} workshop={workshop} />
                    ))}
                  </div>
                </div>
              )}

              {workshops.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No workshops available yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
