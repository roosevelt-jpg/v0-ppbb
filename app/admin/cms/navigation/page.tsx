'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, ChevronUp, ChevronDown, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  subscribeToNavigation,
  DEFAULT_NAVIGATION,
  NavigationConfig,
  NavLink,
  ensureCommunityNavLink,
} from '@/lib/platform-config'

export default function AdminCmsNavigationPage() {
  const [config, setConfig] = useState<NavigationConfig>(DEFAULT_NAVIGATION)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    return subscribeToNavigation(setConfig)
  }, [])

  const updateLink = (index: number, field: keyof NavLink, value: string | number | boolean) => {
    setConfig((prev) => {
      const links = [...prev.links]
      links[index] = { ...links[index], [field]: value }
      return { ...prev, links }
    })
  }

  const addLink = () => {
    setConfig((prev) => ({
      ...prev,
      links: [
        ...prev.links,
        {
          label: 'New link',
          href: '/',
          order: prev.links.length,
          isVisible: true,
        },
      ],
    }))
  }

  const removeLink = (index: number) => {
    setConfig((prev) => {
      const target = prev.links[index]
      if (
        target &&
        (target.href.replace(/\/$/, '').toLowerCase() === '/communities' ||
          target.label.trim().toLowerCase() === 'community')
      ) {
        setMessage({
          type: 'error',
          text: 'Community is a required navbar link and cannot be removed.',
        })
        return prev
      }
      return {
        ...prev,
        links: prev.links
          .filter((_, i) => i !== index)
          .map((link, i) => ({ ...link, order: i })),
      }
    })
  }

  const moveLink = (index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      const links = [...prev.links]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= links.length) return prev
      ;[links[index], links[target]] = [links[target], links[index]]
      return {
        ...prev,
        links: links.map((link, i) => ({ ...link, order: i })),
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const payload: NavigationConfig = {
        ...config,
        links: ensureCommunityNavLink(config.links),
      }
      setConfig(payload)
      const res = await fetch('/api/platform-config/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Navigation saved. Changes are live on the public site.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save navigation',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPageLayout title="Navigation">
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold text-neutral-900 dark:text-foreground">Navigation</h1>
          <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-1">
            Manage navbar links, labels, and CTA button. Changes sync instantly via Firestore.
          </p>
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
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <Card className="p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Auth labels &amp; CTA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sign in label</label>
              <input
                type="text"
                value={config.signInLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, signInLabel: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CTA button label</label>
              <input
                type="text"
                value={config.ctaButton.label}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    ctaButton: { ...prev.ctaButton, label: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">CTA button link</label>
              <input
                type="text"
                value={config.ctaButton.href}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    ctaButton: { ...prev.ctaButton, href: e.target.value },
                  }))
                }
                className="w-full"
                placeholder="/join"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Navbar links</h2>
            <Button type="button" onClick={addLink} className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-1" />
              Add link
            </Button>
          </div>

          <div className="space-y-3">
            {config.links.map((link, index) => (
              <div
                key={`${link.href}-${index}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border border-neutral-200 dark:border-border rounded-lg"
              >
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Label</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium mb-1">Href</label>
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => updateLink(index, 'href', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input
                    type="number"
                    value={link.order}
                    onChange={(e) => updateLink(index, 'order', parseInt(e.target.value, 10) || 0)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-1 flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={link.isVisible}
                    onChange={(e) => updateLink(index, 'isVisible', e.target.checked)}
                    id={`visible-${index}`}
                  />
                  <label htmlFor={`visible-${index}`} className="text-xs">
                    Visible
                  </label>
                </div>
                <div className="md:col-span-2 flex gap-1 justify-end">
                  <button
                    type="button"
                    onClick={() => moveLink(index, 'up')}
                    disabled={index === 0}
                    className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLink(index, 'down')}
                    disabled={index === config.links.length - 1}
                    className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="p-2 bg-black !text-white shadow-none min-h-0 hover:bg-neutral-800"
                    aria-label="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save navigation'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  )
}
