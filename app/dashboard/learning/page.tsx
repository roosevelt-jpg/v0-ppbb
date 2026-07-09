'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { BookOpen, Video, FileText, Users } from 'lucide-react'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'

function parseDate(value: unknown): string {
  if (!value) return 'Date TBA'
  try {
    const d =
      typeof value === 'object' && value !== null && 'toDate' in value
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string)
    return Number.isNaN(d.getTime()) ? 'Date TBA' : d.toLocaleDateString()
  } catch {
    return 'Date TBA'
  }
}

export default function LearningPage() {
  const [resources, setResources] = useState<Record<string, unknown>[]>([])
  const [workshops, setWorkshops] = useState<Record<string, unknown>[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubs: Array<() => void> = []
    let pending = 3
    const done = () => {
      pending -= 1
      if (pending <= 0) setLoading(false)
    }

    const handleResourceSnap = (snapshot: { docs?: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      const docs = snapshot?.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? []
      setResources((prev) => {
        const merged = new Map<string, Record<string, unknown>>()
        for (const row of [...prev, ...docs]) merged.set(String(row.id), row)
        return Array.from(merged.values())
      })
      done()
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'learningResources'), where('status', '==', 'published')),
        handleResourceSnap,
        (err) => {
          console.error('[v0] learningResources error:', err)
          setError('Failed to load learning resources.')
          done()
        }
      )
    )
    unsubs.push(
      onSnapshot(
        query(collection(db, 'resources')),
        handleResourceSnap,
        (err) => {
          console.error('[v0] resources error:', err)
          setError('Failed to load learning resources.')
          done()
        }
      )
    )
    unsubs.push(
      onSnapshot(
        query(collection(db, 'workshops')),
        (snapshot) => {
          setWorkshops(snapshot?.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? [])
          done()
        },
        (err) => {
          console.error('[v0] workshops error:', err)
          setError('Failed to load workshops.')
          done()
        }
      )
    )

    return () => unsubs.forEach((u) => u())
  }, [])

  const filteredResources =
    filter === 'all' ? resources : resources.filter((r) => String(r.type ?? '').toLowerCase() === filter)

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-neutral-700" />
      case 'document':
        return <FileText className="w-5 h-5 text-neutral-700" />
      case 'workshop':
        return <Users className="w-5 h-5 text-neutral-700" />
      default:
        return <BookOpen className="w-5 h-5 text-neutral-700" />
    }
  }

  if (loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Learning" subtitle="Videos, documents, and workshops for members">
      <div className="flex flex-wrap gap-2 mb-8">
        {['all', 'video', 'document', 'workshop'].map((f) => (
          <DashboardTabButton key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </DashboardTabButton>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-neutral-900">Learning Resources</h2>
        {filteredResources.length === 0 ? (
          <DashboardEmptyState
            title={`No ${filter === 'all' ? '' : filter + ' '}resources`}
            description={`No ${filter === 'all' ? '' : filter + ' '}resources available yet.`}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card key={String(resource.id)} className="p-5 border border-neutral-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">{getIcon(String(resource.type ?? ''))}</div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-neutral-900 line-clamp-2">{String(resource.title ?? 'Resource')}</h3>
                    <p className="text-xs text-neutral-500 capitalize">{String(resource.type ?? 'resource')}</p>
                  </div>
                </div>
                {resource.description ? (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-3">{String(resource.description)}</p>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500">{String(resource.duration ?? 'Self-paced')}</span>
                  {resource.fileUrl || resource.url ? (
                    <a
                      href={String(resource.fileUrl ?? resource.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="!bg-black !text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">Coming soon</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-neutral-900">Upcoming Workshops</h2>
        {workshops.length === 0 ? (
          <DashboardEmptyState title="No workshops scheduled" description="Check back for upcoming workshops." />
        ) : (
          <div className="space-y-4">
            {workshops.map((workshop) => {
              const sessions = Array.isArray(workshop.sessions) ? workshop.sessions : []
              return (
                <Card key={String(workshop.id)} className="p-5 border border-neutral-200">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900">{String(workshop.title ?? 'Workshop')}</h3>
                      {workshop.description ? (
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{String(workshop.description)}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-neutral-600">
                        {workshop.instructor ? <span>Instructor: {String(workshop.instructor)}</span> : null}
                        <span>Date: {parseDate(workshop.date ?? workshop.startDate)}</span>
                        <span>Participants: {Number(workshop.participants ?? 0)}</span>
                      </div>
                      {sessions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          {sessions.map((session: Record<string, unknown>, idx: number) => (
                            <div
                              key={String(session.id ?? idx)}
                              className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                            >
                              <p className="font-medium text-sm text-neutral-900 line-clamp-2">
                                {String(session.title ?? `Session ${idx + 1}`)}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">{parseDate(session.date)}</p>
                              {session.description ? (
                                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{String(session.description)}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <button type="button" className="shrink-0 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold h-fit">
                      Register
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <Card className="p-6 border border-neutral-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <h2 className="text-xl font-bold mb-2 text-neutral-900">Spiritual Development</h2>
        <p className="text-neutral-600 mb-4 text-sm">
          Enhance your spiritual growth through guided meditations, reflections, and community wisdom sharing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Daily Meditations', 'Community Reflections', 'Wisdom Articles'].map((item) => (
            <button
              key={item}
              type="button"
              className="!bg-white !text-black border border-gray-300 rounded-lg px-4 py-3 text-sm font-semibold text-left hover:bg-neutral-50"
            >
              {item}
            </button>
          ))}
        </div>
      </Card>
    </DashboardPageShell>
  )
}
