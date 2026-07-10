'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { EventPickerSelect } from '@/components/admin/event-picker-select'
import { adminApiFetch, adminApiUpload } from '@/lib/admin-api-client'
import type { AssetFile, AssetFolder } from '@/lib/asset-library-types'
import { Film, Image, Trash2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

function FileTypeIcon({ type }: { type: AssetFile['type'] }) {
  if (type === 'video') return <Film className="h-4 w-4" />
  if (type === 'photo') return <Image className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

export default function AdminAssetFolderPage() {
  const params = useParams()
  const folderId = params.folderId as string

  const [folder, setFolder] = React.useState<AssetFolder | null>(null)
  const [files, setFiles] = React.useState<AssetFile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null)
  const [uploadMeta, setUploadMeta] = React.useState({ tags: '', description: '' })
  const [editEvent, setEditEvent] = React.useState(false)
  const [eventId, setEventId] = React.useState('')
  const [eventTitle, setEventTitle] = React.useState('')
  const [lastBulkResult, setLastBulkResult] = React.useState<{
    ok: number
    failed: number
  } | null>(null)

  const load = React.useCallback(async () => {
    const json = await adminApiFetch<{ folder: AssetFolder; files: AssetFile[] }>(
      `/api/admin/assets/folders/${folderId}`
    )
    if (json.success && json.data) {
      setFolder(json.data.folder)
      setFiles(json.data.files)
      setEventId(json.data.folder.eventId || '')
      setEventTitle(json.data.folder.eventTitle || '')
    }
    setLoading(false)
  }, [folderId])

  React.useEffect(() => {
    load()
  }, [load])

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected?.length) return

    setUploading(true)
    setLastBulkResult(null)
    setUploadProgress(`Uploading 0 / ${selected.length}…`)

    const form = new FormData()
    form.append('folderId', folderId)
    form.append('tags', uploadMeta.tags)
    form.append('description', uploadMeta.description)
    Array.from(selected).forEach((file) => form.append('files', file))

    const json = await adminApiUpload<AssetFile[]>(`/api/admin/assets/files`, form)
    setUploading(false)
    e.target.value = ''
    setUploadProgress(null)

    const uploaded = (json as { uploaded?: AssetFile[] }).uploaded || []
    const failed = (json as { failed?: unknown[] }).failed || []
    setLastBulkResult({ ok: uploaded.length, failed: failed.length })

    if (json.success || uploaded.length > 0) {
      load()
    }
    if (failed.length > 0 && uploaded.length === 0) {
      alert(json.error || 'All uploads failed')
    }
  }

  const handleSaveEvent = async () => {
    const json = await adminApiFetch(`/api/admin/assets/folders/${folderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ eventId: eventId || null, eventTitle: eventTitle || null }),
    })
    if (json.success) {
      setEditEvent(false)
      load()
    } else {
      alert(json.error || 'Failed to update event link')
    }
  }

  const handlePublish = async () => {
    const json = await adminApiFetch(`/api/admin/assets/folders/${folderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: folder?.status === 'published' ? 'draft' : 'published' }),
    })
    if (json.success) load()
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file permanently?')) return
    const json = await adminApiFetch(`/api/admin/assets/files/${fileId}`, { method: 'DELETE' })
    if (json.success) load()
  }

  const handleDeleteFolder = async () => {
    if (!confirm('Delete this folder and all files?')) return
    const json = await adminApiFetch(`/api/admin/assets/folders/${folderId}`, { method: 'DELETE' })
    if (json.success) window.location.href = '/admin/assets'
  }

  if (loading) {
    return (
      <AdminPageLayout title="Event Assets">
        <p className="text-gray-500">Loading…</p>
      </AdminPageLayout>
    )
  }

  if (!folder) {
    return (
      <AdminPageLayout title="Event Assets">
        <p className="text-red-500">Folder not found.</p>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Event Assets">
      <div className="space-y-6">
        <div>
          <Link href="/admin/assets" className="text-sm text-gray-500 hover:text-black">
            ← All folders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-2">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black">{folder.name}</h1>
              {folder.eventTitle && !editEvent && (
                <p className="text-sm text-gray-500 mt-1">
                  Event: {folder.eventTitle}
                  {folder.eventId && (
                    <>
                      {' '}
                      ·{' '}
                      <Link href={`/admin/events/${folder.eventId}`} className="underline">
                        View in Events
                      </Link>
                    </>
                  )}
                </p>
              )}
              {folder.description && (
                <p className="text-sm text-gray-600 mt-2 max-w-2xl">{folder.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {folder.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
              {!editEvent ? (
                <button
                  type="button"
                  onClick={() => setEditEvent(true)}
                  className="mt-3 text-xs text-gray-500 underline"
                >
                  {folder.eventId ? 'Change linked event' : 'Link to an event'}
                </button>
              ) : (
                <div className="mt-4 max-w-md space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <EventPickerSelect
                    value={eventId}
                    eventTitle={eventTitle}
                    onChange={(id, title) => {
                      setEventId(id)
                      setEventTitle(title)
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEvent}
                      className="px-3 py-1.5 bg-black text-white rounded-lg text-sm"
                    >
                      Save event link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditEvent(false)
                        setEventId(folder.eventId || '')
                        setEventTitle(folder.eventTitle || '')
                      }}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm"
              >
                {folder.status === 'published' ? 'Unpublish' : 'Publish folder'}
              </button>
              <button
                type="button"
                onClick={handleDeleteFolder}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm"
              >
                Delete folder
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk upload photos & videos
          </h2>
          <p className="text-sm text-gray-500">
            Select multiple files at once. Shared tags apply to every file in the batch.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={uploadMeta.tags}
              onChange={(e) => setUploadMeta({ ...uploadMeta, tags: e.target.value })}
              placeholder="Shared tags: keynote, group-photo, day-1"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={uploadMeta.description}
              onChange={(e) => setUploadMeta({ ...uploadMeta, description: e.target.value })}
              placeholder="Shared description (optional)"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm cursor-pointer hover:bg-gray-900">
            <Upload className="h-4 w-4" />
            {uploading ? uploadProgress || 'Uploading…' : 'Choose multiple files'}
            <input
              type="file"
              accept="image/*,video/*,.pdf"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleBulkUpload}
            />
          </label>
          {lastBulkResult && (
            <div className="flex flex-wrap gap-4 text-sm">
              {lastBulkResult.ok > 0 && (
                <span className="inline-flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {lastBulkResult.ok} uploaded
                </span>
              )}
              {lastBulkResult.failed > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {lastBulkResult.failed} failed
                </span>
              )}
            </div>
          )}
        </div>

        {files.length === 0 ? (
          <p className="text-gray-500 text-sm">No files uploaded yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <div key={file.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                  {file.type === 'photo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : file.type === 'video' ? (
                    <video src={file.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <FileTypeIcon type={file.type} />
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <FileTypeIcon type={file.type} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        {file.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{file.description}</p>
                        )}
                        {file.storageProvider === 'google_drive' && (
                          <p className="text-xs text-blue-600">Synced to Google Drive</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-500 hover:text-red-700 shrink-0"
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
