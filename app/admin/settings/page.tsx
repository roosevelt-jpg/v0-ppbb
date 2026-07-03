'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { SiteSettings } from '@/lib/types'
import { Save, AlertCircle, Upload, X, Share2, Globe, MessageCircle, Settings, Mail, Link2, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

type TabType = 'general' | 'contact' | 'social' | 'integrations'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = React.useState<TabType>('general')
  const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string>('')
  const [logoDarkPreview, setLogoDarkPreview] = React.useState<string>('')

  // Load settings from API
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const json = await res.json()

        if (json.success && json.data) {
          setSiteSettings(json.data)
          setLogoPreview(json.data.logoUrl || '')
          setLogoDarkPreview(json.data.logoUrlDark || '')
        } else {
          // Default settings
          const defaultSettings: SiteSettings = {
            id: 'default',
            siteName: 'Passive Blessings',
            siteDescription: 'Community platform for events, volunteering, and community support',
            logoUrl: '',
            logoUrlDark: '',
            faviconUrl: '/favicon.ico',
            primaryColor: '#111111',
            secondaryColor: '#f7f6f2',
            accentColor: '#888888',
            email: 'support@passiveblessings.ae',
            phone: '+971 50 000 0000',
            address: 'Dubai, UAE',
            socialLinks: {},
            footerText: 'Passive Blessings © 2025. All rights reserved.',
            maintenanceMode: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          setSiteSettings(defaultSettings)
        }
      } catch (error) {
        console.error('[v0] Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSettingChange = (field: keyof SiteSettings, value: any) => {
    if (!siteSettings) return
    setSiteSettings({ ...siteSettings, [field]: value })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isDark: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', isDark ? 'branding/logo-dark' : 'branding/logo-light')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Upload failed')

      const preview = URL.createObjectURL(file)
      if (isDark) {
        setLogoDarkPreview(preview)
        handleSettingChange('logoUrlDark', json.data.url)
      } else {
        setLogoPreview(preview)
        handleSettingChange('logoUrl', json.data.url)
      }

      setMessage({ type: 'success', text: 'Logo uploaded successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!siteSettings) return

    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings),
      })

      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Settings" subtitle="Configure platform settings">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </AdminPageLayout>
    )
  }

  if (!siteSettings) {
    return (
      <AdminPageLayout title="Settings" subtitle="Configure platform settings">
        <div className="text-center py-12 text-red-600">
          <p>Failed to load settings</p>
        </div>
      </AdminPageLayout>
    )
  }

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact', icon: <Mail className="w-4 h-4" /> },
    { id: 'social', label: 'Social Media', icon: <Share2 className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Zap className="w-4 h-4" /> },
  ]

  return (
    <AdminPageLayout title="Settings" subtitle="Configure platform settings">
      <div className="space-y-6">
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <p>{message.text}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-black rounded" />
            Site Branding
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                value={siteSettings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Site Description</label>
              <textarea
                value={siteSettings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Logo (Light)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="w-24 h-24 mx-auto mb-2 object-contain" />
                  )}
                  <label className="block">
                    <span className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      {logoPreview ? 'Change' : 'Upload'} Logo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, false)}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Logo (Dark)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {logoDarkPreview && (
                    <img
                      src={logoDarkPreview}
                      alt="Dark logo preview"
                      className="w-24 h-24 mx-auto mb-2 object-contain"
                    />
                  )}
                  <label className="block">
                    <span className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      {logoDarkPreview ? 'Change' : 'Upload'} Logo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, true)}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={siteSettings.email}
                onChange={(e) => handleSettingChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={siteSettings.phone}
                onChange={(e) => handleSettingChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={siteSettings.address}
                onChange={(e) => handleSettingChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </Card>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Social Media Links</h2>

          <div className="space-y-4">
            {[
              { key: 'twitter', label: 'Twitter' },
              { key: 'facebook', label: 'Facebook' },
              { key: 'instagram', label: 'Instagram' },
              { key: 'linkedin', label: 'LinkedIn' },
              { key: 'youtube', label: 'YouTube' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {label} URL
                </label>
                <input
                  type="url"
                  placeholder={`https://${key}.com/yourprofile`}
                  value={(siteSettings.socialLinks as any)?.[key] || ''}
                  onChange={(e) => handleSettingChange('socialLinks', {
                    ...siteSettings.socialLinks,
                    [key]: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </Card>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">API Integrations</h2>
          <p className="text-gray-600 mb-6">Manage and configure external integrations for your platform.</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Gmail SMTP</h3>
              <p className="text-sm text-gray-600 mb-3">Configure email notifications</p>
              <Button variant="outline" className="text-sm">Configure</Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Stripe</h3>
              <p className="text-sm text-gray-600 mb-3">Payment processing</p>
              <Button variant="outline" className="text-sm">Configure</Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Google Calendar</h3>
              <p className="text-sm text-gray-600 mb-3">Event synchronization</p>
              <Button variant="outline" className="text-sm">Configure</Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">YouTube Data API</h3>
              <p className="text-sm text-gray-600 mb-3">Video integration and management</p>
              <Button variant="outline" className="text-sm">Configure</Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Google Maps / Places</h3>
              <p className="text-sm text-gray-600 mb-3">Location services and mapping</p>
              <Button variant="outline" className="text-sm">Configure</Button>
            </div>
          </div>
        </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  )
}
