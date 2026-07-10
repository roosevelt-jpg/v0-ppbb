'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { adminApiFetch, adminApiUpload } from '@/lib/admin-api-client'
import type { AssetFile, AssetFolder } from '@/lib/asset-library-types'
import { Film, Image, Trash2, Upload, FileText } from 'lucide-react'

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
  const [uploadMeta, setUploadMeta] = React.useState({ name: '', tags: '', description: '' })

  const load = React.useCallback(async () => {
    const json = await adminApiFetch<{ folder: AssetFolder; files: AssetFile[] }>(
      `/api/admin/assets/folders/${folderId}`
    )
    if (json.success && json.data) {
      setFolder(json.data.folder)
      setFiles(json.data.files)
    }
    setLoading(false)
  }, [folderId])

  React.useEffect(() => {
    load()
  }, [load])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('folderId', folderId)
    form.append('name', uploadMeta.name || file.name)
    form.append('tags', uploadMeta.tags)
    form.append('description', uploadMeta.description)
    const json = await adminApiUpload<AssetFile>('/api/admin/assets/files', form)
    setUploading(false)
    e.target.value = ''
    if (json.success) {
      setUploadMeta({ name: '', tags: '', description: '' })
      load()
    } else {
      alert(json.error || 'Upload failed')
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
            <div>
              <h1 className="text-2xl font-bold text-black">{folder.name}</h1>
              {folder.eventTitle && (
                <p className="text-sm text-gray-500 mt-1">Event: {folder.eventTitle}</p>
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
            Upload photo or video
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              value={uploadMeta.name}
              onChange={(e) => setUploadMeta({ ...uploadMeta, name: e.target.value })}
              placeholder="Display name (optional)"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={uploadMeta.tags}
              onChange={(e) => setUploadMeta({ ...uploadMeta, tags: e.target.value })}
              placeholder="Tags: keynote, group-photo"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={uploadMeta.description}
              onChange={(e) => setUploadMeta({ ...uploadMeta, description: e.target.value })}
              placeholder="Short description"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm cursor-pointer hover:bg-gray-900">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Choose file'}
            <input
              type="file"
              accept="image/*,video/*,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
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
