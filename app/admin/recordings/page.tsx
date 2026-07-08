'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, Eye, Music, Video } from 'lucide-react'

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'audio' | 'video'>('all')

  React.useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    try {
      const res = await fetch('/api/recordings?status=draft', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setRecordings(json.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
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
        setRecordings(recordings.filter(r => r.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting recording:', error)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch('/api/recordings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'published' }),
      })
      const json = await res.json()
      if (json.success) {
        loadRecordings()
      }
    } catch (error) {
      console.error('[v0] Error publishing recording:', error)
    }
  }

  const filtered = filter === 'all' ? recordings : recordings.filter(r => r.type === filter)

  if (loading) {
    return (
      <AdminPageLayout title="Recordings">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading recordings...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Recordings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-black">All Recordings (Draft)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm font-medium ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('audio')}
                className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${filter === 'audio' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <Music size={16} /> Audio
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${filter === 'video' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <Video size={16} /> Video
              </button>
            </div>
          </div>
          <Link
            href="/admin/recordings/create"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <Plus size={20} />
            Upload Recording
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No recordings found. Upload your first recording!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Speaker</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((recording: any) => (
                  <tr key={recording.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{recording.title}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                        recording.type === 'audio' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {recording.type === 'audio' ? <Music size={14} /> : <Video size={14} />}
                        {recording.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{recording.speaker || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{recording.duration ? `${Math.floor(recording.duration / 60)}m` : '-'}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Draft</span>
                    </td>
                    <td className="px-6 py-3 text-sm space-x-2 flex">
                      <Link
                        href={`/admin/recordings/${recording.id}`}
                        className="p-1 text-neutral-900 hover:bg-neutral-100 rounded"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handlePublish(recording.id)}
                        className="p-1 text-neutral-900 hover:bg-neutral-100 rounded"
                        title="Publish"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(recording.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
