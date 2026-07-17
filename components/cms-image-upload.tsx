'use client'

import React from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import type { CmsImagePreset } from '@/lib/image-service'

type Props = {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
  /** Compression / resize preset (images are auto-resized before upload) */
  preset?: CmsImagePreset
  accept?: string
  helpText?: string
  alt?: string
  className?: string
}

/**
 * Shared CMS image control: direct upload only (no URL paste).
 * Uses uploadImageToFirebase which compresses/resizes client-side.
 */
export function CmsImageUpload({
  label,
  value,
  onChange,
  folder,
  preset = 'content',
  accept = 'image/*,image/gif',
  helpText = 'Upload an image (auto-resized). JPG, PNG, WebP, or GIF — not a URL.',
  alt = 'Preview',
  className = '',
}: Props) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadImageToFirebase(file, folder, { preset })
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label className="block text-sm font-medium text-neutral-800">{label}</label>
      <p className="text-xs text-neutral-500">{helpText}</p>

      {value ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={alt}
            className="w-full max-h-40 object-cover rounded-lg border border-neutral-200"
          />
          <div className="flex flex-wrap items-center gap-1">
            <label className="pb-compact-btn inline-flex items-center gap-1 h-6 px-2 rounded-md bg-black text-white text-[11px] font-semibold cursor-pointer hover:bg-neutral-900">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? 'Uploading…' : 'Replace'}
              <input
                type="file"
                accept={accept}
                className="hidden"
                disabled={uploading}
                onChange={(e) => void handleFile(e)}
              />
            </label>
            <button
              type="button"
              disabled={uploading}
              onClick={() => onChange('')}
              className="pb-compact-btn inline-flex items-center gap-1 h-6 px-2 rounded-md bg-black text-white text-[11px] font-semibold hover:bg-neutral-900 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="pb-compact-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-black text-white text-xs font-semibold cursor-pointer hover:bg-neutral-900 w-fit">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading…' : 'Upload image'}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => void handleFile(e)}
          />
        </label>
      )}

      {error ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
      ) : null}
    </div>
  )
}
