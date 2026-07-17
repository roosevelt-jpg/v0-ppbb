'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import {
  subscribeToVolunteerConfig,
  DEFAULT_VOLUNTEER_CONFIG,
  VolunteerPlatformConfig,
} from '@/lib/volunteer-config'
import { CmsImageUpload } from '@/components/cms-image-upload'
import { Save, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react'

export default function AdminCmsVolunteerPage() {
  const [config, setConfig] = useState<VolunteerPlatformConfig>(DEFAULT_VOLUNTEER_CONFIG)
  const [saving, setSaving] = useState(false)
  const [newPillar, setNewPillar] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [ready, setReady] = useState(false)

  useEffect(
    () =>
      subscribeToVolunteerConfig((data) => {
        setConfig(data)
        setReady(true)
      }),
    []
  )

  const pc = config.pageConfig

  const updatePage = <K extends keyof typeof pc>(key: K, value: (typeof pc)[K]) => {
    setConfig({
      ...config,
      pageConfig: { ...pc, [key]: value },
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({
        type: 'success',
        text: 'Volunteer config saved. Live on /volunteer instantly via onSnapshot.',
      })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save',
      })
    } finally {
      setSaving(false)
    }
  }

  const addPillar = () => {
    const trimmed = newPillar.trim()
    if (!trimmed) return
    if (pc.pillarOptions.includes(trimmed)) {
      setNewPillar('')
      return
    }
    updatePage('pillarOptions', [...pc.pillarOptions, trimmed])
    setNewPillar('')
  }

  const removePillar = (index: number) => {
    updatePage(
      'pillarOptions',
      pc.pillarOptions.filter((_, i) => i !== index)
    )
  }

  const field = (
    key: 'eyebrow' | 'headline' | 'body' | 'formLink' | 'trackingNote',
    label: string,
    multiline = false
  ) => (
    <div className="space-y-1">
      <label
        className="block text-xs uppercase tracking-wider text-neutral-500"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          value={pc[key]}
          onChange={(e) => updatePage(key, e.target.value)}
          rows={4}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      ) : (
        <input
          type="text"
          value={pc[key]}
          onChange={(e) => updatePage(key, e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      )}
    </div>
  )

  if (!ready) {
    return (
      <AdminPageLayout title="Volunteer Config" subtitle="Loading…">
        <div className="w-full min-w-0 max-w-3xl space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-neutral-200 rounded" />
          <div className="h-24 w-full bg-neutral-100 rounded" />
          <div className="h-24 w-full bg-neutral-100 rounded" />
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Volunteer Config"
      subtitle="Page copy, image, form link, and pillar options for /volunteer"
    >
      <div className="max-w-3xl w-full min-w-0 space-y-6">
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            CMS
          </p>
          <h1
            className="text-2xl sm:text-3xl text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Volunteer Config
          </h1>
          <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Edits save to platformConfig/volunteer and sync live via onSnapshot.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 rounded p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6">
          {field('eyebrow', 'Eyebrow')}
          {field('headline', 'Headline')}
          {field('body', 'Body', true)}
          {field('formLink', 'External form link (optional fallback)')}
          {field('trackingNote', 'Tracking note', true)}

          <CmsImageUpload
            label="Hero / team image"
            value={pc.imageURL || ''}
            folder="volunteer/cms"
            preset="content"
            onChange={(url) => updatePage('imageURL', url)}
          />

          <div className="space-y-3">
            <label
              className="block text-xs uppercase tracking-wider text-neutral-500"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Pillar options (application dropdown)
            </label>
            <ul className="space-y-2">
              {pc.pillarOptions.map((pillar, index) => (
                <li
                  key={`${pillar}-${index}`}
                  className="flex items-center gap-2 border border-neutral-200 rounded px-3 py-2"
                >
                  <span
                    className="flex-1 text-sm text-neutral-800 min-w-0 break-words"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {pillar}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePillar(index)}
                    className="pb-compact-btn inline-flex items-center justify-center h-6 w-6 min-h-0 min-w-0 rounded bg-black text-white [&_svg]:h-3 [&_svg]:w-3 hover:bg-red-700"
                    aria-label={`Remove ${pillar}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                placeholder="Add a pillar"
                className="flex-1 border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addPillar()
                  }
                }}
              />
              <button
                type="button"
                onClick={addPillar}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-white text-black border border-neutral-300 rounded text-sm font-semibold hover:bg-neutral-50"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Plus className="w-4 h-4" />
                Add pillar
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 bg-black text-white rounded text-sm font-semibold hover:bg-neutral-900 disabled:opacity-60 w-full sm:w-auto"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save volunteer config'}
        </button>
      </div>
    </AdminPageLayout>
  )
}
