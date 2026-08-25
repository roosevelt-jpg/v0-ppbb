'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { BookOpen, Video, FileText, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'
import {
  SPIRITUAL_CATEGORY_OPTIONS,
  subscribeToPublishedLearningResources,
  spiritualCategoryLabel,
  type LearningResource,
  type LearningResourceCategory,
} from '@/lib/learning-resources'

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

function resourceHref(resource: LearningResource): string | null {
  return resource.fileUrl || resource.url || null
}

export default function LearningPage() {
  const [resources, setResources] = useState<LearningResource[]>([])
  const [legacyResources, setLegacyResources] = useState<Record<string, unknown>[]>([])
  const [workshops, setWorkshops] = useState<Record<string, unknown>[]>([])
  const [filter, setFilter] = useState('all')
  const [spiritualFilter, setSpiritualFilter] = useState<LearningResourceCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const spiritualRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const unsubs: Array<() => void> = []
    let pending = 2
    const done = () => {
      pending -= 1
      if (pending <= 0) setLoading(false)
    }

    unsubs.push(
      subscribeToPublishedLearningResources(
        (data) => {
          setResources(data)
          done()
        },
        (err) => {
          console.error('[v0] learningResources error:', err)
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

    // Legacy resources collection (optional)
    unsubs.push(
      onSnapshot(query(collection(db, 'resources')), (snapshot) => {
        setLegacyResources(snapshot?.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? [])
      })
    )

    return () => unsubs.forEach((u) => u())
  }, [])

  const generalResources = useMemo(
    () => resources.filter((r) => r.category === 'general'),
    [resources]
  )

  const spiritualResources = useMemo(() => {
    if (!spiritualFilter) return []
    return resources.filter((r) => r.category === spiritualFilter)
  }, [resources, spiritualFilter])

  const displayResources = useMemo(() => {
    const merged = [
      ...generalResources,
      ...legacyResources.map((r) => ({
        id: String(r.id),
        title: String(r.title ?? 'Resource'),
        description: String(r.description ?? ''),
        category: 'general' as const,
        type: (String(r.type ?? 'article') as LearningResource['type']),
        url: r.url ? String(r.url) : undefined,
        fileUrl: r.fileUrl ? String(r.fileUrl) : undefined,
        duration: r.duration ? String(r.duration) : undefined,
        status: 'published' as const,
      })),
    ]
    if (filter === 'all') return merged
    return merged.filter((r) => r.type === filter)
  }, [generalResources, legacyResources, filter])

  const openSpiritualSection = (category: LearningResourceCategory) => {
    setSpiritualFilter(category)
    window.setTimeout(() => {
      spiritualRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
      case 'document':
        return <FileText className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
      case 'audio':
        return <BookOpen className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
      case 'workshop':
        return <Users className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
      default:
        return <BookOpen className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
    }
  }

  const renderResourceCards = (items: Array<LearningResource | (typeof displayResources)[number]>) => {
    if (items.length === 0) {
      return (
        <DashboardEmptyState
          title="Nothing published yet"
          description="Your team can add content in Admin → CMS → Learning Resources."
        />
      )
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((resource) => {
          const href = resourceHref(resource as LearningResource)
          return (
            <Card key={String(resource.id)} className="p-5 border border-neutral-200 dark:border-border">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">{getIcon(String(resource.type ?? ''))}</div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-foreground line-clamp-2">{String(resource.title ?? 'Resource')}</h3>
                  <p className="text-xs text-neutral-500 dark:text-muted-foreground capitalize">{String(resource.type ?? 'resource')}</p>
                </div>
              </div>
              {resource.description ? (
                <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-4 line-clamp-3">{String(resource.description)}</p>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-500 dark:text-muted-foreground">{String(resource.duration ?? 'Self-paced')}</span>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="!bg-black !text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Open
                  </a>
                ) : (
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">No link yet</span>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  if (loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Learning" subtitle="Videos, documents, and workshops for members">
      <div className="flex flex-wrap gap-2 mb-8">
        {['all', 'video', 'document', 'article', 'audio'].map((f) => (
          <DashboardTabButton key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </DashboardTabButton>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-foreground">Learning Resources</h2>
        {displayResources.length === 0 ? (
          <DashboardEmptyState
            title={`No ${filter === 'all' ? '' : filter + ' '}resources`}
            description="Published resources appear here. Admins can post content under CMS → Learning Resources."
          />
        ) : (
          renderResourceCards(displayResources)
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-foreground">Upcoming Workshops</h2>
        {workshops.length === 0 ? (
          <DashboardEmptyState title="No workshops scheduled" description="Check back for upcoming workshops." />
        ) : (
          <div className="space-y-4">
            {workshops.map((workshop) => {
              const sessions = Array.isArray(workshop.sessions) ? workshop.sessions : []
              return (
                <Card key={String(workshop.id)} className="p-5 border border-neutral-200 dark:border-border">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-foreground">{String(workshop.title ?? 'Workshop')}</h3>
                      {workshop.description ? (
                        <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-1 line-clamp-2">{String(workshop.description)}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-neutral-600 dark:text-muted-foreground">
                        {workshop.instructor ? <span>Instructor: {String(workshop.instructor)}</span> : null}
                        <span>Date: {parseDate(workshop.date ?? workshop.startDate)}</span>
                        <span>Participants: {Number(workshop.participants ?? 0)}</span>
                      </div>
                      {sessions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          {sessions.map((session: Record<string, unknown>, idx: number) => (
                            <div
                              key={String(session.id ?? idx)}
                              className="rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-white/5 p-3"
                            >
                              <p className="font-medium text-sm text-neutral-900 dark:text-foreground line-clamp-2">
                                {String(session.title ?? `Session ${idx + 1}`)}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-1">{parseDate(session.date)}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Link
                      href="/workshops"
                      className="shrink-0 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold h-fit inline-flex items-center justify-center"
                    >
                      View workshops
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <Card className="p-6 border border-neutral-200 dark:border-border bg-gradient-to-r from-purple-50 to-blue-50">
        <h2 className="text-xl font-bold mb-2 text-neutral-900 dark:text-foreground">Spiritual Development</h2>
        <p className="text-neutral-600 dark:text-muted-foreground mb-4 text-sm">
          Enhance your spiritual growth through guided meditations, reflections, and community wisdom sharing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SPIRITUAL_CATEGORY_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => openSpiritualSection(item.value)}
              className={`rounded-lg px-4 py-3 text-sm font-semibold text-left min-h-[44px] transition-colors ${
                spiritualFilter === item.value
                  ? '!bg-black !text-white'
                  : '!bg-white dark:!bg-neutral-800 !text-black dark:!text-foreground border border-gray-300 dark:border-border hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {spiritualFilter ? (
        <section ref={spiritualRef} className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-foreground">
            {spiritualCategoryLabel(spiritualFilter)}
          </h2>
          {renderResourceCards(spiritualResources)}
        </section>
      ) : null}
    </DashboardPageShell>
  )
}
