'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSiteSettings, updateSiteSettings } from '@/lib/admin'
import { setApiConfig, getApiConfig } from '@/lib/api-config'
import { fileToBase64 } from '@/lib/image-upload'
import { SiteSettings, ApiConfig } from '@/lib/types'
import { Save, AlertCircle, Upload, X } from 'lucide-react'

export default function AdminSettings() {
  const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null)
  const [apiConfigs, setApiConfigs] = React.useState<{ stripe?: Partial<ApiConfig>; sendgrid?: Partial<ApiConfig> }>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string>('')
  const [logoDarkPreview, setLogoDarkPreview] = React.useState<string>('')

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettings()
        if (settings) {
          setSiteSettings(settings)
          setLogoPreview(settings.logoUrl || '')
          setLogoDarkPreview(settings.logoUrlDark || '')
        } else {
          // Initialize default settings
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

        // Load API configs
        const stripeConfig = await getApiConfig('stripe')
        const sendgridConfig = await getApiConfig('sendgrid')

        setApiConfigs({
          stripe: stripeConfig || { status: 'inactive' },
          sendgrid: sendgridConfig || { status: 'inactive' },
        })
      } catch (error) {
        console.error('[v0] Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSiteSettingsChange = (field: keyof SiteSettings, value: any) => {
    if (!siteSettings) return
    setSiteSettings({
      ...siteSettings,
      [field]: value,
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isDark: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const base64 = await fileToBase64(file)
      if (isDark) {
        setLogoDarkPreview(base64)
        handleSiteSettingsChange('logoUrlDark', base64)
      } else {
        setLogoPreview(base64)
        handleSiteSettingsChange('logoUrl', base64)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload logo' })
    }
  }

  const handleApiConfigChange = (service: 'stripe' | 'sendgrid', field: string, value: string) => {
    setApiConfigs((prev) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value,
      },
    }))
  }

  const handleSaveSiteSettings = async () => {
    if (!siteSettings) return
    setSaving(true)
    try {
      await updateSiteSettings(siteSettings)
      setMessage({ type: 'success', text: 'Site settings saved successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save site settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiConfig = async (service: 'stripe' | 'sendgrid') => {
    setSaving(true)
    try {
      const config = apiConfigs[service]
      if (!config) return

      await setApiConfig(service, config as any)
      setMessage({ type: 'success', text: `${service} configuration saved` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save ${service} configuration` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Settings" subtitle="Configure your platform" />
        <div className="p-8" style={{ backgroundColor: '#f7f6f2' }}>
          <p style={{ color: '#888888' }}>Loading settings...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Settings" subtitle="Configure your platform, branding, and API integrations" />

      <div className="p-8 space-y-8" style={{ backgroundColor: '#f7f6f2' }}>
        {message && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
              borderColor: message.type === 'success' ? '#2e7d32' : '#c62828',
              color: message.type === 'success' ? '#2e7d32' : '#c62828',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 500 }}>{message.text}</p>
          </div>
        )}

        {/* Site Branding Settings */}
        <Card className="p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}
          >
            Site Branding
          </h2>

          <div className="space-y-6">
            {/* Site Name */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Site Name
              </label>
              <input
                type="text"
                value={siteSettings?.siteName || ''}
                onChange={(e) => handleSiteSettingsChange('siteName', e.target.value)}
                className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
              />
            </div>

            {/* Site Description */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Site Description
              </label>
              <textarea
                value={siteSettings?.siteDescription || ''}
                onChange={(e) => handleSiteSettingsChange('siteDescription', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333', minHeight: '100px' }}
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Logo (Light Background)
              </label>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-warm-white transition cursor-pointer"
                    style={{ borderColor: '#e4e1da' }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, false)}
                      className="hidden"
                      id="logoUpload"
                    />
                    <label htmlFor="logoUpload" className="cursor-pointer block">
                      <Upload className="w-4 h-4 mx-auto mb-1" style={{ color: '#888888' }} />
                      <div className="text-xs" style={{ color: '#888888' }}>Click to upload</div>
                    </label>
                  </div>
                </div>
                {logoPreview && (
                  <div className="flex items-center gap-2">
                    <img src={logoPreview} alt="Logo preview" style={{ maxHeight: '50px', maxWidth: '100px' }} />
                    <button
                      onClick={() => {
                        setLogoPreview('')
                        handleSiteSettingsChange('logoUrl', '')
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-4 h-4" style={{ color: '#c62828' }} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dark Logo Upload */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Logo (Dark Background)
              </label>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-warm-white transition cursor-pointer"
                    style={{ borderColor: '#e4e1da' }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, true)}
                      className="hidden"
                      id="logoDarkUpload"
                    />
                    <label htmlFor="logoDarkUpload" className="cursor-pointer block">
                      <Upload className="w-4 h-4 mx-auto mb-1" style={{ color: '#888888' }} />
                      <div className="text-xs" style={{ color: '#888888' }}>Click to upload</div>
                    </label>
                  </div>
                </div>
                {logoDarkPreview && (
                  <div className="flex items-center gap-2">
                    <img src={logoDarkPreview} alt="Dark logo preview" style={{ maxHeight: '50px', maxWidth: '100px' }} />
                    <button
                      onClick={() => {
                        setLogoDarkPreview('')
                        handleSiteSettingsChange('logoUrlDark', '')
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-4 h-4" style={{ color: '#c62828' }} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Primary Color
                </label>
                <input
                  type="color"
                  value={siteSettings?.primaryColor || '#111111'}
                  onChange={(e) => handleSiteSettingsChange('primaryColor', e.target.value)}
                  className="w-full h-9 border rounded-lg cursor-pointer"
                  style={{ borderColor: '#e4e1da' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={siteSettings?.secondaryColor || '#f7f6f2'}
                  onChange={(e) => handleSiteSettingsChange('secondaryColor', e.target.value)}
                  className="w-full h-9 border rounded-lg cursor-pointer"
                  style={{ borderColor: '#e4e1da' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Accent Color
                </label>
                <input
                  type="color"
                  value={siteSettings?.accentColor || '#888888'}
                  onChange={(e) => handleSiteSettingsChange('accentColor', e.target.value)}
                  className="w-full h-9 border rounded-lg cursor-pointer"
                  style={{ borderColor: '#e4e1da' }}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={siteSettings?.email || ''}
                  onChange={(e) => handleSiteSettingsChange('email', e.target.value)}
                  className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                  style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={siteSettings?.phone || ''}
                  onChange={(e) => handleSiteSettingsChange('phone', e.target.value)}
                  className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                  style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Address
              </label>
              <input
                type="text"
                value={siteSettings?.address || ''}
                onChange={(e) => handleSiteSettingsChange('address', e.target.value)}
                className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Footer Text
              </label>
              <input
                type="text"
                value={siteSettings?.footerText || ''}
                onChange={(e) => handleSiteSettingsChange('footerText', e.target.value)}
                className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
              />
            </div>

            <button
              onClick={handleSaveSiteSettings}
              disabled={saving}
              className="w-full h-8 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50"
              style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
            >
              <Save className="w-4 h-4 inline mr-2" />
              {saving ? 'Saving...' : 'Save Site Settings'}
            </button>
          </div>
        </Card>

        {/* Social Media Links */}
        <Card className="p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}
          >
            Social Media Links
          </h2>
          <p className="text-sm mb-6" style={{ color: '#888888' }}>
            Add your social media URLs. They will appear in the footer.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Facebook URL
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/passiveblessings"
                value={siteSettings?.socialLinks?.facebook || ''}
                onChange={(e) => handleSiteSettingsChange('socialLinks', { ...siteSettings?.socialLinks, facebook: e.target.value })}
                className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Twitter URL
              </label>
              <input
                type="url"
                placeholder="https://twitter.com/passiveblessings"
                value={siteSettings?.socialLinks?.twitter || ''}
                onChange={(e) => handleSiteSettingsChange('socialLinks', { ...siteSettings?.socialLinks, twitter: e.target.value })}
                className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Instagram URL
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/passiveblessings"
                value={siteSettings?.socialLinks?.instagram || ''}
                onChange={(e) => handleSiteSettingsChange('socialLinks', { ...siteSettings?.socialLinks, instagram: e.target.value })}
                className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                LinkedIn URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/company/passiveblessings"
                value={siteSettings?.socialLinks?.linkedin || ''}
                onChange={(e) => handleSiteSettingsChange('socialLinks', { ...siteSettings?.socialLinks, linkedin: e.target.value })}
                className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
              />
            </div>

            <button
              onClick={handleSaveSiteSettings}
              disabled={saving}
              className="w-full h-8 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50"
              style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
            >
              <Save className="w-4 h-4 inline mr-2" />
              {saving ? 'Saving...' : 'Save Social Media Links'}
            </button>
          </div>
        </Card>

        {/* API Configurations */}
        <Card className="p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}
          >
            API Integrations
          </h2>
          <p className="text-sm mb-6" style={{ color: '#888888' }}>
            Add your API keys to enable payment processing and email features
          </p>

          {/* Stripe */}
          <div className="mb-8 pb-8 border-b" style={{ borderColor: '#e4e1da' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#333333' }}>
              Stripe Integration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Stripe API Key (Secret)
                </label>
                <input
                  type="password"
                  placeholder="sk_live_..."
                  value={apiConfigs.stripe?.apiKey || ''}
                  onChange={(e) => handleApiConfigChange('stripe', 'apiKey', e.target.value)}
                  className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                  style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={apiConfigs.stripe?.status === 'active'}
                  onChange={(e) => handleApiConfigChange('stripe', 'status', e.target.checked ? 'active' : 'inactive')}
                />
                <span className="text-sm" style={{ color: '#333333' }}>Active</span>
              </label>
              <button
                onClick={() => handleSaveApiConfig('stripe')}
                disabled={saving}
                className="w-full h-8 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
              >
                Save Stripe Config
              </button>
            </div>
          </div>

          {/* SendGrid */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#333333' }}>
              SendGrid Integration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  SendGrid API Key
                </label>
                <input
                  type="password"
                  placeholder="SG...."
                  value={apiConfigs.sendgrid?.apiKey || ''}
                  onChange={(e) => handleApiConfigChange('sendgrid', 'apiKey', e.target.value)}
                  className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                  style={{ borderColor: '#e4e1da', backgroundColor: '#ffffff', color: '#333333' }}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={apiConfigs.sendgrid?.status === 'active'}
                  onChange={(e) => handleApiConfigChange('sendgrid', 'status', e.target.checked ? 'active' : 'inactive')}
                />
                <span className="text-sm" style={{ color: '#333333' }}>Active</span>
              </label>
              <button
                onClick={() => handleSaveApiConfig('sendgrid')}
                disabled={saving}
                className="w-full h-8 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
              >
                Save SendGrid Config
              </button>
            </div>
          </div>
        </Card>

        {/* System Alert */}
        <Card
          className="p-8 border flex gap-4"
          style={{
            backgroundColor: '#fff3cd',
            borderColor: '#ffc107',
          }}
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0" style={{ color: '#856404' }} />
          <div>
            <h3 className="font-semibold" style={{ color: '#856404' }}>
              Important
            </h3>
            <p className="text-sm mt-2" style={{ color: '#856404' }}>
              API keys are encrypted and stored securely. Never share these keys with anyone. Consider these as passwords. All keys are stored in Firestore with encryption enabled.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
