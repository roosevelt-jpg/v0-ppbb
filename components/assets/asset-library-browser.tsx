'use client'

import React from 'react'
import Link from 'next/link'
import { FolderOpen, Image, Film, FileText, Search, Tag, Calendar } from 'lucide-react'
import { auth } from '@/lib/firebase'
import type { AssetFile, AssetFolder } from '@/lib/asset-library-types'

type AssetLibraryBrowserProps = {
  basePath: '/dashboard/assets' | '/business/assets'
  title?: string
}

async function fetchWithAuth(path: string) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  return res.json()
}

function FileIcon({ type }: { type: AssetFile['type'] }) {
  if (type === 'video') return <Film className="h-5 w-5" />
  if (type === 'photo') return <Image className="h-5 w-5" />
  return <FileText className="h-5 w-5" />
}

export function AssetLibraryBrowser({ basePath, title = 'Event Assets' }: AssetLibraryBrowserProps) {
  const [folders, setFolders] = React.useState<AssetFolder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [tagFilter, setTagFilter] = React.useState('')
  const [eventFilter, setEventFilter] = React.useState('')
  const [eventOptions, setEventOptions] = React.useState<Array<{ id: string; title: string }>>([])

  React.useEffect(() => {
    fetchWithAuth('/api/assets/folders')
      .then((json) => {
        if (!json.success) return
        const map = new Map<string, string>()
        for (const f of (json.data || []) as AssetFolder[]) {
          if (f.eventId && f.eventTitle) map.set(f.eventId, f.eventTitle)
        }
        setEventOptions(Array.from(map.entries()).map(([id, title]) => ({ id, title })))
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams()
        if (tagFilter) params.set('tag', tagFilter)
        if (eventFilter) params.set('eventId', eventFilter)
        const qs = params.toString() ? `?${params.toString()}` : ''
        const json = await fetchWithAuth(`/api/assets/folders${qs}`)
        if (json.success) setFolders(json.data || [])
      } catch (e) {
        console.error('[assets] load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tagFilter, eventFilter])

  const filtered = folders.filter((f) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      f.name.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      f.eventTitle?.toLowerCase().includes(q) ||
      f.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return <p className="p-6 text-sm text-neutral-500">Loading event assets…</p>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Photos and videos from platform events — browse by folder name or tags.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search folders…"
            className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm"
          />
        </div>
        <div className="relative sm:w-56">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Filter by tag"
            className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm"
          />
        </div>
        {eventOptions.length > 0 && (
          <div className="relative sm:w-56">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white appearance-none"
            >
              <option value="">All events</option>
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-100">
          <FolderOpen className="h-10 w-10 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">No event asset folders published yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((folder) => (
            <Link
              key={folder.id}
              href={`${basePath}/${folder.id}`}
              className="group rounded-xl border border-neutral-200 bg-white overflow-hidden hover:border-neutral-400 transition-colors"
            >
              <div className="aspect-video bg-neutral-100 flex items-center justify-center overflow-hidden">
                {folder.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={folder.coverImageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <FolderOpen className="h-12 w-12 text-neutral-300" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-neutral-900 line-clamp-1">{folder.name}</h2>
                {folder.eventTitle && (
                  <p className="text-xs text-neutral-500">Event: {folder.eventTitle}</p>
                )}
                {folder.description && (
                  <p className="text-sm text-neutral-600 line-clamp-2">{folder.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {folder.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-neutral-400">{folder.fileCount} file(s)</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AssetFolderDetail({
  folderId,
  basePath,
}: {
  folderId: string
  basePath: '/dashboard/assets' | '/business/assets'
}) {
  const [folder, setFolder] = React.useState<AssetFolder | null>(null)
  const [files, setFiles] = React.useState<AssetFile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tagFilter, setTagFilter] = React.useState('')

  React.useEffect(() => {
    const load = async () => {
      try {
        const qs = tagFilter ? `?tag=${encodeURIComponent(tagFilter)}` : ''
        const json = await fetchWithAuth(`/api/assets/folders/${folderId}${qs}`)
        if (json.success) {
          setFolder(json.data.folder)
          setFiles(json.data.files || [])
        }
      } catch (e) {
        console.error('[assets] folder load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [folderId, tagFilter])

  if (loading) return <p className="p-6 text-sm text-neutral-500">Loading folder…</p>
  if (!folder) return <p className="p-6 text-sm text-red-500">Folder not found.</p>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <Link href={basePath} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to folders
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-2">{folder.name}</h1>
        {folder.eventTitle && (
          <p className="text-sm text-neutral-500 mt-1">
            Event: {folder.eventTitle}
            {folder.eventId && (
              <>
                {' '}
                ·{' '}
                <Link href={`/events/${folder.eventId}`} className="underline">
                  View event
                </Link>
              </>
            )}
          </p>
        )}
        {folder.description && <p className="text-sm text-neutral-600 mt-2">{folder.description}</p>}
        <div className="flex flex-wrap gap-1 mt-3">
          {folder.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative max-w-xs">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Filter files by tag or name"
          className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm"
        />
      </div>

      {files.length === 0 ? (
        <p className="text-neutral-500 text-sm">No files in this folder yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <div key={file.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <div className="aspect-video bg-neutral-100 flex items-center justify-center overflow-hidden">
                {file.type === 'photo' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type === 'video' ? (
                  <video src={file.url} controls className="w-full h-full object-cover" />
                ) : (
                  <FileIcon type={file.type} />
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-start gap-2">
                  <FileIcon type={file.type} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-neutral-900 truncate">{file.name}</p>
                    {file.description && (
                      <p className="text-xs text-neutral-500 line-clamp-2">{file.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {file.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-700 underline"
                >
                  Open / download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
