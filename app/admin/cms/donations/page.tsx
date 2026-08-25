'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import {
  subscribeToDonationsConfig,
  DEFAULT_DONATIONS_CONFIG,
  DonationsPlatformConfig,
} from '@/lib/donations-config'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminCmsDonationsPage() {
  const [config, setConfig] = useState<DonationsPlatformConfig>(DEFAULT_DONATIONS_CONFIG)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  useEffect(() => subscribeToDonationsConfig(setConfig), [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Donations config saved. Live on /donate instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save',
      })
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof DonationsPlatformConfig, label: string, multiline = false) => (
    <div className="space-y-1">
      <label
        className="block text-xs uppercase tracking-wider text-neutral-500"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          value={config[key]}
          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          rows={4}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      ) : (
        <input
          type="text"
          value={config[key]}
          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      )}
    </div>
  )

  return (
    <AdminPageLayout
      title="Donations Page CMS"
      subtitle="Beit Al Khair payment URL and legal partnership copy for /donate"
    >
      <div className="w-full min-w-0 max-w-3xl space-y-6">
        {message && (
          <div
            className={`flex items-start gap-2 rounded p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg border border-neutral-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Payment fallback
          </h2>
          {field('beitAlKhairURL', 'Beit Al Khair payment URL')}
          <p className="text-xs text-neutral-500">
            Used when a cause has no assigned charity partner payment link.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Page header
          </h2>
          {field('pageEyebrow', 'Eyebrow')}
          {field('pageHeadline', 'Headline')}
          {field('pageBody', 'Body', true)}
        </div>

        <div className="bg-white rounded-lg border border-neutral-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Legal partnership block
          </h2>
          {field('legalPartnershipTitle', 'Title')}
          {field('legalPartnershipBody', 'Body', true)}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-7 min-h-0 inline-flex items-center gap-2 bg-black hover:bg-neutral-900 text-white px-5 py-2.5 rounded text-sm font-semibold disabled:opacity-50"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save donations config'}
        </button>
      </div>
    </AdminPageLayout>
  )
}
