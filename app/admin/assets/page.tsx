'use client'

import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { EventPickerSelect } from '@/components/admin/event-picker-select'
import { adminApiFetch } from '@/lib/admin-api-client'
import { getStorageProviderLabel } from '@/lib/asset-library-types'
import type { AssetFolder, AssetStorageProvider } from '@/lib/asset-library-types'
import { FolderOpen, Plus, Settings, Tag } from 'lucide-react'

export default function AdminAssetsPage() {
  const [folders, setFolders] = React.useState<AssetFolder[]>([])
  const [storageProvider, setStorageProvider] = React.useState<AssetStorageProvider>('firebase')
  const [loading, setLoading] = React.useState(true)
  const [showCreate, setShowCreate] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    tags: '',
    eventId: '',
    eventTitle: '',
    visibility: 'both' as AssetFolder['visibility'],
    status: 'draft' as AssetFolder['status'],
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    const json = await adminApiFetch<AssetFolder[]>('/api/admin/assets/folders?status=all')
    if (json.success && json.data) setFolders(json.data)
    if ((json as { storageProvider?: AssetStorageProvider }).storageProvider) {
      setStorageProvider((json as { storageProvider: AssetStorageProvider }).storageProvider)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const json = await adminApiFetch<AssetFolder>('/api/admin/assets/folders', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (json.success) {
      setShowCreate(false)
      setForm({
        name: '',
        description: '',
        tags: '',
        eventId: '',
        eventTitle: '',
        visibility: 'both',
        status: 'draft',
      })
      load()
    } else {
      alert(json.error || 'Failed to create folder')
    }
  }

  return (
    <AdminPageLayout title="Event Assets">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Event Asset Library</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload photos & videos from events into tagged folders for members and businesses.
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Storage: {getStorageProviderLabel(storageProvider)} —{' '}
              <Link href="/admin/integrations" className="underline">
                configure in Integrations
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            <Plus className="h-4 w-4" />
            New folder
          </button>
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 max-w-xl"
          >
            <h2 className="font-semibold text-lg">Create asset folder</h2>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Folder name (e.g. Ramadan Iftar 2026)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description — what is inside this folder?"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <EventPickerSelect
              value={form.eventId}
              eventTitle={form.eventTitle}
              onChange={(eventId, eventTitle) => setForm({ ...form, eventId, eventTitle })}
            />
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags (comma-separated): photos, volunteer, keynote"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Visibility
                <select
                  value={form.visibility}
                  onChange={(e) =>
                    setForm({ ...form, visibility: e.target.value as AssetFolder['visibility'] })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="both">Members & Businesses</option>
                  <option value="members">Members only</option>
                  <option value="business">Businesses only</option>
                </select>
              </label>
              <label className="text-sm">
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as AssetFolder['status'] })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create folder'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Loading folders…</p>
        ) : folders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <FolderOpen className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No folders yet. Create one to start uploading event media.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/admin/assets/${folder.id}`}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-gray-400 transition-colors"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {folder.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={folder.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FolderOpen className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-black truncate">{folder.name}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        folder.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {folder.status}
                    </span>
                  </div>
                  {folder.eventTitle && (
                    <p className="text-xs text-gray-500">Event: {folder.eventTitle}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {folder.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {folder.fileCount} files · {folder.visibility}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
