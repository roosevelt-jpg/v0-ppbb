'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Upload, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HeroButton,
  HeroButtonStyle,
  HeroImage,
  HeroTransitionType,
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

  const handleHeroImagesAdd = async (files: FileList) => {
    setUploading('hero')
    try {
      const added: HeroImage[] = []
      for (const file of Array.from(files)) {
        const url = await uploadHomepageImage(file, 'homepage/hero')
        added.push({
          id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          imageURL: url,
          caption: '',
        })
      }
      setConfig((p) => ({
        ...p,
        hero: { ...p.hero, images: [...p.hero.images, ...added] },
      }))
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const handleMissionImageUpload = async (file: File) => {
    setUploading('mission')
    try {
      const url = await uploadHomepageImage(file, 'homepage/mission')
      setConfig((p) => ({ ...p, mission: { ...p.mission, imageURL: url } }))
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const updateHeroImage = (id: string, field: 'caption', value: string) => {
    setConfig((p) => ({
      ...p,
      hero: {
        ...p.hero,
        images: p.hero.images.map((img) => (img.id === id ? { ...img, [field]: value } : img)),
      },
    }))
  }

  const removeHeroImage = (id: string) => {
    setConfig((p) => ({
      ...p,
      hero: { ...p.hero, images: p.hero.images.filter((img) => img.id !== id) },
    }))
  }

  const moveHeroImage = (index: number, direction: 'up' | 'down') => {
    setConfig((p) => {
      const images = [...p.hero.images]
      const swap = direction === 'up' ? index - 1 : index + 1
      if (swap < 0 || swap >= images.length) return p
      ;[images[index], images[swap]] = [images[swap], images[index]]
      return { ...p, hero: { ...p.hero, images } }
    })
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
          </div>

          <div className="space-y-4 pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-sm">Hero images (slider)</h3>
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm">
                <Upload className="w-4 h-4" />
                {uploading === 'hero' ? 'Uploading…' : 'Add image'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading === 'hero'}
                  onChange={(e) => {
                    const files = e.target.files
                    if (files?.length) void handleHeroImagesAdd(files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-2 w-full min-w-0">
                <label htmlFor="hero-transition" className="block text-sm font-medium leading-normal">
                  Transition
                </label>
                <select
                  id="hero-transition"
                  value={config.hero.slider.transition}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      hero: {
                        ...p.hero,
                        slider: {
                          ...p.hero.slider,
                          transition: e.target.value as HeroTransitionType,
                        },
                      },
                    }))
                  }
                  className="w-full block"
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 w-full min-w-0">
                <label htmlFor="hero-speed" className="block text-sm font-medium leading-normal">
                  Speed (seconds per slide)
                </label>
                <input
                  id="hero-speed"
                  type="number"
                  min={2}
                  max={30}
                  value={config.hero.slider.speedSeconds}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      hero: {
                        ...p.hero,
                        slider: {
                          ...p.hero.slider,
                          speedSeconds: parseInt(e.target.value, 10) || 5,
                        },
                      },
                    }))
                  }
                  className="w-full block"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.hero.slider.autoplay}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        hero: {
                          ...p.hero,
                          slider: { ...p.hero.slider, autoplay: e.target.checked },
                        },
                      }))
                    }
                  />
                  Autoplay carousel
                </label>
              </div>
            </div>

            {config.hero.images.length === 0 ? (
              <p className="text-sm text-neutral-500">No hero images yet. Add one or more above.</p>
            ) : (
              <div className="space-y-3">
                {config.hero.images.map((img, i) => (
                  <div
                    key={img.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <img
                        src={img.imageURL}
                        alt=""
                        className="w-full h-20 object-cover rounded border border-neutral-200"
                      />
                    </div>
                    <div className="md:col-span-7">
                      <label className="block text-xs font-medium mb-1">Caption (optional)</label>
                      <input
                        type="text"
                        value={img.caption || ''}
                        onChange={(e) => updateHeroImage(img.id, 'caption', e.target.value)}
                        placeholder="COMMUNITY LED since day one."
                        className="w-full"
                      />
                    </div>
                    <div className="md:col-span-3 flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => moveHeroImage(i, 'up')}
                        disabled={i === 0}
                        className="p-2 border rounded hover:bg-neutral-50 disabled:opacity-40"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHeroImage(i, 'down')}
                        disabled={i === config.hero.images.length - 1}
                        className="p-2 border rounded hover:bg-neutral-50 disabled:opacity-40"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeHeroImage(img.id)}
                        className="p-2 bg-red-600 text-white rounded"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-2 w-full min-w-0">
              <label htmlFor="marquee-speed" className="block text-sm font-medium leading-normal">
                Speed (seconds per loop)
              </label>
              <input
                id="marquee-speed"
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
                className="w-full block"
              />
            </div>
            <div className="flex flex-col gap-2 w-full min-w-0">
              <label htmlFor="marquee-gap" className="block text-sm font-medium leading-normal">
                Gap (px between logos)
              </label>
              <input
                id="marquee-gap"
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
                className="w-full block"
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
                  onChange={(e) => e.target.files?.[0] && handleMissionImageUpload(e.target.files[0])}
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
