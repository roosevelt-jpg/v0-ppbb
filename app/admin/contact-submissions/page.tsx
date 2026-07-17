'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Search, Trash2, AlertCircle, Inbox, Check } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { PARTNERS_CONTACT_SUBJECTS } from '@/components/partners/get-in-touch-form'

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  source: string
  status: 'unread' | 'read' | 'resolved' | string
  submittedAt: Date | null
}

function asDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybe = value as { toDate?: () => Date }
    if (typeof maybe.toDate === 'function') return maybe.toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function mapDoc(id: string, data: Record<string, unknown>): ContactSubmission {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : '',
    email: typeof data.email === 'string' ? data.email : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    subject: typeof data.subject === 'string' ? data.subject : '',
    message: typeof data.message === 'string' ? data.message : '',
    source: typeof data.source === 'string' ? data.source : 'website',
    status: typeof data.status === 'string' ? data.status : 'unread',
    submittedAt: asDate(data.submittedAt),
  }
}

function sourceLabel(source: string) {
  if (source === 'partners') return 'Sponsorship / Partnership'
  if (source === 'contact') return 'Other inquiry'
  if (source === 'partnership' || source === 'sponsorship') return 'Sponsorship / Partnership'
  return 'Other inquiry'
}

function categoryOf(item: ContactSubmission): 'partnership' | 'other' {
  const s = `${item.source} ${item.subject}`.toLowerCase()
  if (
    item.source === 'partners' ||
    /partner|sponsor|collaborat/i.test(s)
  ) {
    return 'partnership'
  }
  return 'other'
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export default function ContactSubmissionsPage() {
  const [items, setItems] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'partnership' | 'other'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ContactSubmission | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadViaApi = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/contact?source=submissions', {
        cache: 'no-store',
        headers,
      })
      const json = await res.json()
      if (!json.success || !Array.isArray(json.data)) {
        throw new Error(json.error || 'Failed to load submissions')
      }
      setItems(
        json.data.map((row: Record<string, unknown>) =>
          mapDoc(String(row.id), {
            ...row,
            submittedAt: row.submittedAt,
          })
        )
      )
      setError('')
    } catch (err) {
      console.error('[v0] contact submissions API fallback failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load submissions. Sign in as admin and try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'contactSubmissions'), orderBy('submittedAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)))
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('[v0] contactSubmissions listener failed:', err)
        void loadViaApi()
      }
    )
    return unsub
  }, [loadViaApi])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((item) => {
      if (categoryFilter !== 'all' && categoryOf(item) !== categoryFilter) return false
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!term) return true
      const blob = [item.name, item.email, item.phone, item.subject, item.message, item.source]
        .join(' ')
        .toLowerCase()
      return blob.includes(term)
    })
  }, [items, search, subjectFilter, statusFilter, categoryFilter])

  const unreadCount = items.filter((i) => i.status === 'unread').length

  const handleSelect = async (item: ContactSubmission) => {
    setSelected(item)
    if (item.status !== 'unread') return
    setUpdatingId(item.id)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: item.id,
          status: 'read',
          collection: 'contactSubmissions',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, status: 'read' } : row))
      )
      setSelected((prev) => (prev?.id === item.id ? { ...prev, status: 'read' } : prev))
    } catch (err) {
      console.error('[v0] mark read failed:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleMarkResolved = async (id: string) => {
    setUpdatingId(id)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id,
          status: 'resolved',
          collection: 'contactSubmissions',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      setItems((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: 'resolved' } : row))
      )
      setSelected((prev) => (prev?.id === id ? { ...prev, status: 'resolved' } : prev))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this submission permanently?')) return
    setDeletingId(id)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/contact?id=${id}&source=submissions`, {
        method: 'DELETE',
        headers,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Delete failed')
      if (selected?.id === id) setSelected(null)
      setItems((prev) => prev.filter((row) => row.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminPageLayout
      title="Contact Submissions"
      subtitle="All website inquiries — Sponsorship/Partnership and Other"
    >
      <div className="space-y-4 w-full min-w-0">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['partnership', 'Sponsorship / Partnership Inquiries'],
              ['other', 'Other Inquiries'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategoryFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                categoryFilter === id ? 'bg-black text-white' : 'bg-white border border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm font-body text-neutral-600">
          <span>
            <strong className="text-neutral-900">{items.length}</strong> total
          </span>
          <span className="text-neutral-300">·</span>
          <span>
            <strong className="text-red-600">{unreadCount}</strong> unread
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, message…"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white w-full lg:w-40"
          >
            <option value="all">All statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white w-full lg:w-64"
          >
            <option value="all">All subjects</option>
            {PARTNERS_CONTACT_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Inbox className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <p className="font-headline text-xl font-bold mb-1">No submissions yet</p>
            <p className="font-body text-sm text-neutral-600">
              Messages from Partners Get in Touch and the Contact page appear here in real time.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 min-w-0">
            <div className="xl:col-span-3 admin-table-scroll border border-[#e4e1da] rounded-lg bg-white min-w-0">
              <table className="w-full min-w-[720px] text-left text-sm font-body">
                <thead className="bg-neutral-50 border-b border-[#e4e1da]">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Subject</th>
                    <th className="px-3 py-3 font-semibold">Source</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Submitted</th>
                    <th className="px-3 py-3 font-semibold"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-[#e4e1da] hover:bg-neutral-50 cursor-pointer ${
                        selected?.id === item.id ? 'bg-neutral-100' : ''
                      } ${item.status === 'unread' ? 'font-medium' : ''}`}
                      onClick={() => void handleSelect(item)}
                    >
                      <td className="px-3 py-3 break-words max-w-[10rem]">
                        <div>{item.name}</div>
                        <div className="text-xs text-neutral-500 break-all font-normal">
                          {item.email}
                        </div>
                      </td>
                      <td className="px-3 py-3 break-words max-w-[9rem]">{item.subject}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-neutral-600">
                        {sourceLabel(item.source)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded ${
                            item.status === 'unread'
                              ? 'bg-red-50 text-red-700'
                              : item.status === 'resolved'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-neutral-600">
                        {item.submittedAt ? item.submittedAt.toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          type="button"
                          size="sm"
                          disabled={deletingId === item.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDelete(item.id)
                          }}
                          className="min-h-[36px] bg-red-600 text-white hover:bg-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Card className="xl:col-span-2 p-4 sm:p-5 min-w-0 h-fit">
              {selected ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Mail className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-headline text-xl font-bold break-words">
                        {selected.name}
                      </h3>
                      <a
                        href={`mailto:${selected.email}`}
                        className="font-body text-sm text-neutral-600 break-all underline"
                      >
                        {selected.email}
                      </a>
                    </div>
                  </div>
                  <p className="font-body text-sm">
                    <span className="font-semibold">Phone:</span>{' '}
                    {selected.phone ? (
                      <a href={`tel:${selected.phone}`} className="underline">
                        {selected.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="font-body text-sm">
                    <span className="font-semibold">Subject:</span> {selected.subject}
                  </p>
                  <p className="font-body text-sm">
                    <span className="font-semibold">Source:</span> {sourceLabel(selected.source)}
                  </p>
                  <p className="font-body text-sm text-neutral-600">
                    {selected.submittedAt ? selected.submittedAt.toLocaleString() : 'No date'}
                  </p>
                  <div className="pt-2 border-t border-[#e4e1da]">
                    <p className="eyebrow text-neutral-500 mb-2">Message</p>
                    <p className="font-body text-sm whitespace-pre-wrap break-words">
                      {selected.message}
                    </p>
                  </div>
                  {selected.status !== 'resolved' && (
                    <Button
                      type="button"
                      disabled={updatingId === selected.id}
                      onClick={() => void handleMarkResolved(selected.id)}
                      className="w-full min-h-[44px] bg-black text-white hover:bg-gray-800"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Mark resolved
                    </Button>
                  )}
                </div>
              ) : (
                <p className="font-body text-sm text-neutral-500 text-center py-8">
                  Select a row to read the full message.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
