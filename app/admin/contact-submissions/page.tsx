'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Search, Trash2, AlertCircle, Inbox } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { PARTNERS_CONTACT_SUBJECTS } from '@/components/partners/get-in-touch-form'

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
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

export default function ContactSubmissionsPage() {
  const [items, setItems] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ContactSubmission | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'contactSubmissions'), orderBy('submittedAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setItems(
          snapshot.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              name: typeof data.name === 'string' ? data.name : '',
              email: typeof data.email === 'string' ? data.email : '',
              phone: typeof data.phone === 'string' ? data.phone : '',
              subject: typeof data.subject === 'string' ? data.subject : '',
              message: typeof data.message === 'string' ? data.message : '',
              submittedAt: asDate(data.submittedAt),
            }
          })
        )
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('[v0] contactSubmissions listener failed:', err)
        setError('Failed to load submissions (check Firestore rules).')
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((item) => {
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false
      if (!term) return true
      const blob = [item.name, item.email, item.phone, item.subject, item.message]
        .join(' ')
        .toLowerCase()
      return blob.includes(term)
    })
  }, [items, search, subjectFilter])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this submission permanently?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/contact?id=${id}&source=submissions`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Delete failed')
      if (selected?.id === id) setSelected(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminPageLayout
      title="Contact Submissions"
      subtitle="Get in touch form messages from /partners (and other contact forms)"
    >
      <div className="space-y-4 w-full min-w-0">
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
              Messages from the Partners Get in Touch form will appear here in real time.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 min-w-0">
            <div className="xl:col-span-3 overflow-x-auto border border-[#e4e1da] rounded-lg bg-white">
              <table className="w-full min-w-[640px] text-left text-sm font-body">
                <thead className="bg-neutral-50 border-b border-[#e4e1da]">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Phone</th>
                    <th className="px-3 py-3 font-semibold">Subject</th>
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
                      }`}
                      onClick={() => setSelected(item)}
                    >
                      <td className="px-3 py-3 font-medium break-words max-w-[8rem]">{item.name}</td>
                      <td className="px-3 py-3 break-all max-w-[10rem]">{item.email}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{item.phone || '—'}</td>
                      <td className="px-3 py-3 break-words max-w-[9rem]">{item.subject}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-neutral-600">
                        {item.submittedAt
                          ? item.submittedAt.toLocaleDateString()
                          : '—'}
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
                      <h3 className="font-headline text-xl font-bold break-words">{selected.name}</h3>
                      <p className="font-body text-sm text-neutral-600 break-all">{selected.email}</p>
                    </div>
                  </div>
                  <p className="font-body text-sm">
                    <span className="font-semibold">Phone:</span> {selected.phone || '—'}
                  </p>
                  <p className="font-body text-sm">
                    <span className="font-semibold">Subject:</span> {selected.subject}
                  </p>
                  <p className="font-body text-sm text-neutral-600">
                    {selected.submittedAt
                      ? selected.submittedAt.toLocaleString()
                      : 'No date'}
                  </p>
                  <div className="pt-2 border-t border-[#e4e1da]">
                    <p className="eyebrow text-neutral-500 mb-2">Message</p>
                    <p className="font-body text-sm whitespace-pre-wrap break-words">
                      {selected.message}
                    </p>
                  </div>
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
