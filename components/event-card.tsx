'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Download } from 'lucide-react'
import type { Event } from '@/lib/types'
import { format } from 'date-fns'

interface EventCardProps {
  event: Event
  showActions?: boolean
}

export default function EventCard({ event, showActions = true }: EventCardProps) {
  const handleAddToCalendar = () => {
    // Generate ICS format for calendar
    const dtstart = new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const [endHour, endMin] = event.endTime.split(':')
    const endDate = new Date(event.date)
    endDate.setHours(parseInt(endHour), parseInt(endMin))
    const dtend = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Passive Blessings//Event//EN
BEGIN:VEVENT
UID:${event.id}@passiveblessings.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent))
    element.setAttribute('download', `${event.slug}.ics`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const genderLabel = {
    'mixed': 'Everyone Welcome',
    'ladies-only': 'Ladies Only',
    'men-only': 'Men Only'
  }[event.genderRestriction || 'mixed'] || 'Everyone Welcome'

  const genderColor = {
    'mixed': 'bg-blue-100 text-blue-800',
    'ladies-only': 'bg-pink-100 text-pink-800',
    'men-only': 'bg-purple-100 text-purple-800'
  }[event.genderRestriction || 'mixed'] || 'bg-blue-100 text-blue-800'

  const tagColors: Record<string, string> = {
    'free': 'bg-green-100 text-green-800',
    'rsvp': 'bg-yellow-100 text-yellow-800',
    'premium': 'bg-purple-100 text-purple-800',
    'member-only': 'bg-indigo-100 text-indigo-800',
    'ladies-only': 'bg-pink-100 text-pink-800',
    'men-only': 'bg-purple-100 text-purple-800',
    'networking': 'bg-orange-100 text-orange-800',
    'workshop': 'bg-cyan-100 text-cyan-800',
    'fundraiser': 'bg-red-100 text-red-800',
    'celebration': 'bg-yellow-100 text-yellow-800',
    'educational': 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border border-gray-200 h-full flex flex-col">
      {/* Image with 16:9 aspect ratio */}
      <div className="relative w-full bg-gray-200 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        {event.bannerImage ? (
          <img 
            src={event.bannerImage}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-gray-500 text-sm">No image</span>
          </div>
        )}
        
        {/* Gender Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold ${genderColor}`}>
          {genderLabel}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{event.title}</h3>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className={`text-xs px-2 py-1 rounded font-medium ${tagColors[tag] || 'bg-gray-100 text-gray-800'}`}
              >
                {tag.replace('-', ' ')}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-800">
                +{event.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Date, Time, Location */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-start gap-2 text-gray-700">
            <Calendar size={16} className="flex-shrink-0 mt-0.5" />
            <span>{format(new Date(event.date), 'MMM d, yyyy')} at {event.time}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin size={16} className="flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <Users size={16} className="flex-shrink-0 mt-0.5" />
            <span>{event.registered}/{event.capacity} attending</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{event.description}</p>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Link
              href={`/events/${event.slug}`}
              className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition text-center"
            >
              View Details
            </Link>
            <button
              onClick={handleAddToCalendar}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1"
              title="Add to calendar"
            >
              <Download size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
