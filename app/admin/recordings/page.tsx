'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Plus, Trash2, Eye, EyeOff, Music, Video, ExternalLink } from 'lucide-react'
import { ACTION_ROW, BUTTON_ICON_COMPACT, BUTTON_PRIMARY, FILTER_PILL_ACTIVE, FILTER_PILL_INACTIVE } from '@/lib/admin-design-system'

type StatusFilter = 'all' | 'draft' | 'published'

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'audio' | 'video'>('all')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')

  React.useEffect(() => {
    void loadRecordings()
  }, [])

  const loadRecordings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/recordings?status=all', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setRecordings(Array.isArray(json.data) ? json.data : [])
      }
    } catch (error) {
      console.error('[v0] Error fetching recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`/api/recordings?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setRecordings(recordings.filter((r) => r.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting recording:', error)
    }
  }

  const handleSetStatus = async (id: string, status: 'draft' | 'published') => {
    try {
      const res = await fetch('/api/recordings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (json.success) {
        await loadRecordings()
      }
    } catch (error) {
      console.error('[v0] Error updating recording:', error)
    }
  }

  const filtered = recordings.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (filter !== 'all' && r.type !== filter) return false
    return true
  })

  if (loading) {
    return (
      <AdminPageLayout title="Recordings">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-muted-foreground">Loading recordings...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Recordings"
      subtitle="Published items appear on Educational Resources and /recordings"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'published', 'draft'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={statusFilter === s ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              >
                {s === 'all' ? 'All' : s === 'published' ? 'Published' : 'Draft'}
              </button>
            ))}
            <span className="text-neutral-300 dark:text-muted-foreground px-1">|</span>
            {(['all', 'audio', 'video'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`${filter === t ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE} gap-1`}
              >
                {t === 'audio' ? <Music size={14} /> : null}
                {t === 'video' ? <Video size={14} /> : null}
                {t === 'all' ? 'All types' : t}
              </button>
            ))}
          </div>
          <Link href="/admin/recordings/create" className={`${BUTTON_PRIMARY} gap-1`}>
            <Plus size={16} />
            Upload Recording
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-muted rounded-lg">
            <p className="text-gray-500 dark:text-muted-foreground">No recordings found. Upload your first recording!</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border min-w-0">
            <div className="admin-table-scroll">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-muted border-b border-gray-200 dark:border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Speaker</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Duration</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((recording: any) => (
                    <tr key={recording.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-foreground">{recording.title}</td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 w-fit ${
                            recording.type === 'audio'
                              ? 'bg-neutral-100 dark:bg-muted text-neutral-800 dark:text-foreground'
                              : 'bg-neutral-200 dark:bg-muted text-neutral-900 dark:text-foreground'
                          }`}
                        >
                          {recording.type === 'audio' ? <Music size={14} /> : <Video size={14} />}
                          {recording.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-muted-foreground">{recording.speaker || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-muted-foreground">
                        {recording.duration ? `${recording.duration}m` : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            recording.status === 'published'
                              ? 'bg-black text-white'
                              : 'bg-neutral-100 dark:bg-muted text-neutral-700 dark:text-foreground'
                          }`}
                        >
                          {recording.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap">
                        <div className={ACTION_ROW}>
                          {recording.url ? (
                            <a
                              href={recording.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={BUTTON_ICON_COMPACT}
                              title="Open media"
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : null}
                          {recording.status !== 'published' ? (
                            <button
                              type="button"
                              onClick={() => void handleSetStatus(recording.id, 'published')}
                              className={BUTTON_ICON_COMPACT}
                              title="Publish"
                            >
                              <Eye size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleSetStatus(recording.id, 'draft')}
                              className={BUTTON_ICON_COMPACT}
                              title="Unpublish"
                            >
                              <EyeOff size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDelete(recording.id)}
                            className={BUTTON_ICON_COMPACT}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
