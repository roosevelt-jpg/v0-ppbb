'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ArrowLeft, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'

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
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setError('Thumbnail is too large. Maximum size is 25 MB.')
        e.target.value = ''
        return
      }
      setError(null)
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const saveRecording = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError(null)

    try {
      let thumbnailUrl = formData.thumbnailUrl
      if (thumbnailFile) {
        const fd = new FormData()
        fd.append('file', thumbnailFile)
        fd.append('folder', 'recordings/thumbnails')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        thumbnailUrl = json.url || json.data?.url
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

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="w-full">
      <Link href="/admin/recordings" className="flex items-center gap-2 text-black mb-6 hover:text-gray-700">
        <ArrowLeft size={20} />
        Back to Recordings
      </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-black mb-8">Upload Recording</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

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
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Recording URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
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
                  value={formData.duration || ''}
                  onChange={(e) => handleChange('duration', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {formData.type === 'video' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {thumbnailPreview ? (
                  <div className="relative">
                    <img src={thumbnailPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null)
                        setThumbnailPreview('')
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Upload className="text-gray-400 mb-2" size={28} />
                      <p className="text-gray-600 font-medium">Upload thumbnail (optional)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

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
                onClick={() => saveRecording('draft')}
                disabled={saving}
                className={`${BUTTON_SECONDARY} flex-1 flex items-center justify-center gap-2`}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Draft
              </button>
              <button
                type="button"
                onClick={() => saveRecording('published')}
                disabled={saving}
                className={`${BUTTON_PRIMARY} flex-1 flex items-center justify-center gap-2`}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Publish
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}
