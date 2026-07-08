'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Upload, Plus, Trash2 } from 'lucide-react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HeroButton,
  HeroButtonStyle,
} from '@/lib/homepage-config'
import { uploadImageToFirebase } from '@/lib/upload-utils'

async function uploadHomepageImage(file: File, folder: string): Promise<string> {
  return uploadImageToFirebase(file, folder, { preset: 'content' })
}

export default function AdminCmsHomepagePage() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToHomepage(setConfig), [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Homepage saved. Changes are live instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save homepage',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File, target: 'hero' | 'mission') => {
    setUploading(target)
    try {
      const url = await uploadHomepageImage(file, `homepage/${target}`)
      if (target === 'hero') {
        setConfig((p) => ({ ...p, hero: { ...p.hero, imageURL: url } }))
      } else {
        setConfig((p) => ({ ...p, mission: { ...p.mission, imageURL: url } }))
      }
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const updateHeroButton = (index: number, field: keyof HeroButton, value: string) => {
    setConfig((p) => {
      const buttons = [...p.hero.buttons]
      buttons[index] = { ...buttons[index], [field]: value }
      return { ...p, hero: { ...p.hero, buttons } }
    })
  }

  const addHeroButton = () => {
    setConfig((p) => ({
      ...p,
      hero: {
        ...p.hero,
        buttons: [...p.hero.buttons, { label: 'New button', href: '/', style: 'primary' }],
      },
    }))
  }

  const removeHeroButton = (index: number) => {
    setConfig((p) => ({
      ...p,
      hero: { ...p.hero, buttons: p.hero.buttons.filter((_, i) => i !== index) },
    }))
  }

  const updateStat = (index: number, field: 'number' | 'label', value: string) => {
    setConfig((p) => {
      const items = [...p.stats.items]
      items[index] = { ...items[index], [field]: value }
      return { ...p, stats: { ...p.stats, items } }
    })
  }

  return (
    <AdminPageLayout title="Homepage CMS">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900">Homepage</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Edit hero, stats, marquee settings, and mission (sections 2A–2D). Live sync via Firestore.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save homepage'}
          </Button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}

        {/* 2A Hero */}
        <Card className="p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Hero (2A)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.hero.eyebrow}
                onChange={(e) => setConfig((p) => ({ ...p, hero: { ...p.hero, eyebrow: e.target.value } }))}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.hero.headline}
                onChange={(e) => setConfig((p) => ({ ...p, hero: { ...p.hero, headline: e.target.value } }))}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.hero.body}
                onChange={(e) => setConfig((p) => ({ ...p, hero: { ...p.hero, body: e.target.value } }))}
                className="w-full min-h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image caption</label>
              <input
                type="text"
                value={config.hero.imageCaption}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, hero: { ...p.hero, imageCaption: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hero image</label>
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50">
                <Upload className="w-4 h-4" />
                {uploading === 'hero' ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'hero')}
                />
              </label>
              {config.hero.imageURL && (
                <img src={config.hero.imageURL} alt="" className="mt-2 h-24 rounded object-cover" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Buttons</h3>
              <Button type="button" onClick={addHeroButton} className="bg-black text-white hover:bg-gray-800 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {config.hero.buttons.map((btn, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="md:col-span-4">
                  <label className="text-xs font-medium">Label</label>
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) => updateHeroButton(i, 'label', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium">Href</label>
                  <input
                    type="text"
                    value={btn.href}
                    onChange={(e) => updateHeroButton(i, 'href', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium">Style</label>
                  <select
                    value={btn.style}
                    onChange={(e) => updateHeroButton(i, 'style', e.target.value as HeroButtonStyle)}
                    className="w-full"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeHeroButton(i)}
                    className="p-2 bg-red-600 text-white rounded shadow-none min-h-0 w-full"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 2B Stats */}
        <Card className="p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Stats bar (2B)</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Display mode</label>
            <select
              value={config.stats.displayMode}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  stats: { ...p.stats, displayMode: e.target.value as 'static' | 'live' },
                }))
              }
              className="w-full max-w-xs"
            >
              <option value="static">Static (override numbers)</option>
              <option value="live">Live (Firestore counts)</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.stats.items.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                <div>
                  <label className="text-xs font-medium">Number</label>
                  <input
                    type="text"
                    value={item.number}
                    onChange={(e) => updateStat(i, 'number', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Label</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateStat(i, 'label', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 2C Marquee settings */}
        <Card className="p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Partners marquee (2C)</h2>
          <p className="text-sm text-neutral-600">
            Partner logos are managed at{' '}
            <a href="/admin/partners" className="underline font-medium">
              /admin/partners
            </a>
            . Configure animation here.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-sm font-medium leading-snug">Speed (seconds per loop)</label>
              <input
                type="number"
                min={10}
                max={120}
                value={config.marquee.speed}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    marquee: { ...p.marquee, speed: parseInt(e.target.value, 10) || 40 },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-sm font-medium leading-snug">Gap (px between logos)</label>
              <input
                type="number"
                min={16}
                max={120}
                value={config.marquee.gap}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    marquee: { ...p.marquee, gap: parseInt(e.target.value, 10) || 48 },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* 2D Mission */}
        <Card className="p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Mission (2D)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.mission.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, mission: { ...p.mission, eyebrow: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.mission.headline}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, mission: { ...p.mission, headline: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Italic word in headline</label>
              <input
                type="text"
                value={config.mission.headlineItalicWord}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    mission: { ...p.mission, headlineItalicWord: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mission image</label>
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50">
                <Upload className="w-4 h-4" />
                {uploading === 'mission' ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'mission')}
                />
              </label>
              {config.mission.imageURL && (
                <img src={config.mission.imageURL} alt="" className="mt-2 h-24 rounded object-cover" />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.mission.body}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, mission: { ...p.mission, body: e.target.value } }))
                }
                className="w-full min-h-28"
              />
            </div>
          </div>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
