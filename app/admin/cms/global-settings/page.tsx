'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  subscribeToGlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettings,
} from '@/lib/platform-config'
import {
  subscribeToReferralsConfig,
  DEFAULT_REFERRALS_CONFIG,
  ReferralsPlatformConfig,
} from '@/lib/referral-config'

export default function AdminCmsGlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS)
  const [referrals, setReferrals] = useState<ReferralsPlatformConfig>(DEFAULT_REFERRALS_CONFIG)
  const [saving, setSaving] = useState(false)
  const [savingReferrals, setSavingReferrals] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    return subscribeToGlobalSettings(setSettings)
  }, [])

  useEffect(() => subscribeToReferralsConfig(setReferrals), [])

  const handleChange = (field: keyof GlobalSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/globalSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Global settings saved. WhatsApp button updates live.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveReferrals = async () => {
    setSavingReferrals(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referrals),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Referral platform defaults saved.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save referrals config',
      })
    } finally {
      setSavingReferrals(false)
    }
  }

  return (
    <AdminPageLayout title="Global Settings">
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold text-neutral-900">Global Settings</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Platform-wide contact details and WhatsApp channel link for the floating button on public pages.
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
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp channel URL</label>
            <input
              type="url"
              value={settings.whatsappLink}
              onChange={(e) => handleChange('whatsappLink', e.target.value)}
              className="w-full"
              placeholder="https://whatsapp.com/channel/..."
            />
            <p className="text-xs text-neutral-500 mt-1">
              Shown as a floating green button on all public pages. Leave empty to hide the button.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Referrals
            </p>
            <h2 className="font-headline text-xl font-bold text-neutral-900">
              Business referral defaults
            </h2>
            <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Stored in platformConfig/referrals. New businesses inherit the default contribution %
              when approved; cookie attribution uses the window below.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default contribution %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={referrals.defaultContributionPercent}
                onChange={(e) =>
                  setReferrals((p) => ({
                    ...p,
                    defaultContributionPercent: Number(e.target.value) || 0,
                  }))
                }
                className="w-full min-h-[44px] border border-neutral-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attribution window (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={referrals.attributionWindowDays}
                onChange={(e) =>
                  setReferrals((p) => ({
                    ...p,
                    attributionWindowDays: Number(e.target.value) || 30,
                  }))
                }
                className="w-full min-h-[44px] border border-neutral-300 rounded px-3 py-2"
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSaveReferrals}
            disabled={savingReferrals}
            className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingReferrals ? 'Saving…' : 'Save referral defaults'}
          </Button>
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save global settings'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  )
}
