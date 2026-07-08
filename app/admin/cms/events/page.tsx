'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  EventsPlatformConfig,
  EventsCategory,
} from '@/lib/events-config'

export default function AdminCmsEventsPage() {
  const [config, setConfig] = useState<EventsPlatformConfig>(DEFAULT_EVENTS_CONFIG)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToEventsConfig(setConfig), [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Events page saved. Changes are live instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save events page',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = (index: number, field: keyof EventsCategory, value: string) => {
    setConfig((prev) => {
      const categories = [...prev.categories]
      categories[index] = { ...categories[index], [field]: value }
      return { ...prev, categories }
    })
  }

  const addCategory = () => {
    setConfig((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { id: `category-${prev.categories.length + 1}`, name: 'New category', color: '#111111' },
      ],
    }))
  }

  const removeCategory = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }))
  }

  return (
    <AdminPageLayout title="Events CMS">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900">Events Page</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Edit public /events page copy, filter labels, and category colours. Event records are
              managed at{' '}
              <a href="/admin/events" className="underline font-medium">
                /admin/events
              </a>
              .
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save events page'}
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

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Page text (4A)</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.pageConfig.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, eyebrow: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.pageConfig.headline}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, headline: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.pageConfig.body}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, body: e.target.value },
                  }))
                }
                className="w-full min-h-24"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp button label</label>
                <input
                  type="text"
                  value={config.pageConfig.whatsappButtonLabel}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, whatsappButtonLabel: e.target.value },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  WhatsApp link (optional — falls back to Global Settings)
                </label>
                <input
                  type="url"
                  value={config.pageConfig.whatsappLink}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, whatsappLink: e.target.value },
                    }))
                  }
                  className="w-full"
                  placeholder="https://whatsapp.com/channel/…"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Lineup heading template</label>
                <input
                  type="text"
                  value={config.pageConfig.lineupHeadingTemplate}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, lineupHeadingTemplate: e.target.value },
                    }))
                  }
                  className="w-full"
                  placeholder="{MONTH} LINEUP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lineup count template</label>
                <input
                  type="text"
                  value={config.pageConfig.lineupCountTemplate}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, lineupCountTemplate: e.target.value },
                    }))
                  }
                  className="w-full"
                  placeholder="{count} events this month"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Register button label</label>
                <input
                  type="text"
                  value={config.pageConfig.registerButtonLabel}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, registerButtonLabel: e.target.value },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Details button label</label>
                <input
                  type="text"
                  value={config.pageConfig.detailsButtonLabel}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, detailsButtonLabel: e.target.value },
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Empty lineup message</label>
              <textarea
                value={config.pageConfig.emptyLineupMessage}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, emptyLineupMessage: e.target.value },
                  }))
                }
                className="w-full min-h-20"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-headline text-xl font-bold">Categories (calendar dot colours)</h2>
            <Button
              type="button"
              onClick={addCategory}
              className="bg-black text-white hover:bg-gray-800 text-xs min-h-[44px]"
            >
              <Plus className="w-3 h-3 mr-1" /> Add category
            </Button>
          </div>
          <div className="space-y-3">
            {config.categories.map((category, i) => (
              <div
                key={`${category.id}-${i}`}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 border rounded-lg"
              >
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium">ID</label>
                  <input
                    type="text"
                    value={category.id}
                    onChange={(e) => updateCategory(i, 'id', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-xs font-medium">Name</label>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategory(i, 'name', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium">Colour</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={category.color}
                      onChange={(e) => updateCategory(i, 'color', e.target.value)}
                      className="h-10 w-12 p-1 border rounded"
                    />
                    <input
                      type="text"
                      value={category.color}
                      onChange={(e) => updateCategory(i, 'color', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeCategory(i)}
                    className="flex items-center justify-center min-h-[44px] w-full p-2 bg-red-600 text-white rounded"
                    aria-label="Remove category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
