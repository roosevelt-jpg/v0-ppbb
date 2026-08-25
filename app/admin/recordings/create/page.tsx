'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ArrowLeft, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_BACK } from '@/lib/admin-design-system'
import { uploadToFirebaseStorage } from '@/lib/firebase-storage'

const MAX_MEDIA_BYTES = 500 * 1024 * 1024 // 500 MB — not GB; use a hosted link for larger files
const MAX_THUMB_BYTES = 10 * 1024 * 1024

interface RecordingFormData {
  title: string
  description: string
  type: 'audio' | 'video'
  url: string
  thumbnailUrl: string
  duration?: number
  speaker: string
  date: string
  status: 'draft' | 'published'
}

export default function CreateRecordingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<RecordingFormData>({
    title: '',
    description: '',
    type: 'video',
    url: '',
    thumbnailUrl: '',
    duration: undefined,
    speaker: '',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
  })

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Thumbnail must be an image (JPG, PNG, or WebP) — not a video file.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_THUMB_BYTES) {
      setError('Thumbnail is too large. Maximum size is 10 MB.')
      e.target.value = ''
      return
    }
    setError(null)
    setThumbnailFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setThumbnailPreview(String(ev.target?.result || ''))
    reader.readAsDataURL(file)
  }

  const saveRecording = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError(null)

    try {
      if (!formData.title.trim()) throw new Error('Title is required.')
      if (!formData.speaker.trim()) throw new Error('Speaker is required.')
      if (!formData.url?.trim()) {
        throw new Error('Paste a recording link (YouTube, Drive, etc.) or upload a media file first.')
      }

      let thumbnailUrl = formData.thumbnailUrl
      if (thumbnailFile) {
        const fd = new FormData()
        fd.append('file', thumbnailFile)
        fd.append('folder', 'recordings/thumbnails')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Thumbnail upload failed')
        thumbnailUrl = json.url || json.data?.url || ''
      }

      const res = await fetch('/api/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, thumbnailUrl, status }),
      })

      const json = await res.json()
      if (json.success) {
        router.push('/admin/recordings')
      } else {
        setError(json.error || 'Failed to save recording')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving recording')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof RecordingFormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      setError('Please choose a video or audio file.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setError(
        `File is ${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB. Direct upload max is 500 MB. For larger files, host on YouTube/Drive and paste the link above.`
      )
      e.target.value = ''
      return
    }

    setUploadingMedia(true)
    setError(null)
    setUploadProgress('Starting upload…')
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `recordings/media/${Date.now()}-${safeName}`
      const url = await uploadToFirebaseStorage(file, path, (p) => {
        if (p.status === 'uploading') setUploadProgress(`Uploading… ${p.progress}%`)
        if (p.status === 'success') setUploadProgress('Upload complete')
      })
      handleChange('url', url)
      handleChange('type', file.type.startsWith('audio/') ? 'audio' : 'video')
      setUploadProgress('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Media upload failed. Try a smaller file or paste a hosted link instead.'
      )
      setUploadProgress('')
    } finally {
      setUploadingMedia(false)
      e.target.value = ''
    }
  }

  return (
    <div className="w-full">
      <Link href="/admin/recordings" className={`${BUTTON_BACK} mb-6`}>
        <ArrowLeft />
        Back to Recordings
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-black mb-2">Upload Recording</h1>
        <p className="text-sm text-neutral-600 mb-8">
          Direct file upload max is <strong>500 MB</strong> (not GB). For larger videos, paste a
          YouTube / Vimeo / Drive link — that works without uploading the file here.
        </p>

        {error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        ) : null}

        <form className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Speaker</label>
              <input
                type="text"
                value={formData.speaker}
                onChange={(e) => handleChange('speaker', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recording URL (recommended for large files)
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://… YouTube, Vimeo, Google Drive, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer text-sm font-medium">
                <Upload size={16} />
                {uploadingMedia ? 'Uploading…' : 'Or upload video / audio (max 500 MB)'}
                <input
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  disabled={uploadingMedia}
                  onChange={(e) => void handleMediaUpload(e)}
                />
              </label>
              {uploadProgress ? (
                <span className="text-xs text-neutral-600">{uploadProgress}</span>
              ) : null}
              {formData.url ? (
                <span className="text-xs text-neutral-500 break-all max-w-md">{formData.url}</span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
              <input
                type="number"
                min={0}
                value={formData.duration || ''}
                onChange={(e) =>
                  handleChange('duration', e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {formData.type === 'video' ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Thumbnail image (optional — JPG/PNG only, not the video file)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {thumbnailPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-40 object-cover rounded-lg bg-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null)
                        setThumbnailPreview('')
                      }}
                      className="absolute top-2 right-2 p-1 bg-black !text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Upload className="text-gray-400 mb-2" size={28} />
                      <p className="text-gray-600 font-medium">Upload thumbnail image</p>
                      <p className="text-xs text-neutral-500 mt-1">Max 10 MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/recordings')}
              className={`${BUTTON_SECONDARY} flex-1`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveRecording('draft')}
              disabled={saving || uploadingMedia}
              className={`${BUTTON_SECONDARY} flex-1 flex items-center justify-center gap-2`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Draft
            </button>
            <button
              type="button"
              onClick={() => void saveRecording('published')}
              disabled={saving || uploadingMedia}
              className={`${BUTTON_PRIMARY} flex-1 flex items-center justify-center gap-2`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
