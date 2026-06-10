'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSiteSettings, updateSiteSettings } from '@/lib/admin'
import { setApiConfig, getApiConfig } from '@/lib/api-config'
import { SiteSettings, ApiConfig } from '@/lib/types'
import { Save, AlertCircle } from 'lucide-react'

export default function AdminSettings() {
  const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null)
  const [apiConfigs, setApiConfigs] = React.useState<{ stripe?: Partial<ApiConfig>; sendgrid?: Partial<ApiConfig> }>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettings()
        setSiteSettings(settings)

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
        <div className="p-8">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Settings" subtitle="Configure your platform, branding, and API integrations" />
      
      <div className="p-8 space-y-8">
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
            <p className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Site Settings */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Site Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                value={siteSettings?.siteName || ''}
                onChange={(e) => handleSiteSettingsChange('siteName', e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <textarea
                value={siteSettings?.siteDescription || ''}
                onChange={(e) => handleSiteSettingsChange('siteDescription', e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <input
                  type="color"
                  value={siteSettings?.primaryColor || '#000000'}
                  onChange={(e) => handleSiteSettingsChange('primaryColor', e.target.value)}
                  className="w-full h-10 border border-border rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <input
                  type="color"
                  value={siteSettings?.secondaryColor || '#FFFFFF'}
                  onChange={(e) => handleSiteSettingsChange('secondaryColor', e.target.value)}
                  className="w-full h-10 border border-border rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                value={siteSettings?.email || ''}
                onChange={(e) => handleSiteSettingsChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Phone</label>
              <input
                type="tel"
                value={siteSettings?.phone || ''}
                onChange={(e) => handleSiteSettingsChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <Button onClick={handleSaveSiteSettings} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Site Settings'}
            </Button>
          </div>
        </Card>

        {/* API Configurations */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">API Integrations</h2>
          <p className="text-sm text-muted-foreground mb-6">Add your API keys to enable payment processing and email features</p>

          {/* Stripe */}
          <div className="mb-8 pb-8 border-b border-border">
            <h3 className="text-lg font-semibold mb-4">Stripe Integration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stripe API Key</label>
                <input
                  type="password"
                  placeholder="sk_live_..."
                  value={apiConfigs.stripe?.apiKey || ''}
                  onChange={(e) => handleApiConfigChange('stripe', 'apiKey', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={apiConfigs.stripe?.status === 'active'}
                    onChange={(e) =>
                      handleApiConfigChange('stripe', 'status', e.target.checked ? 'active' : 'inactive')
                    }
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <Button onClick={() => handleSaveApiConfig('stripe')} disabled={saving} className="w-full">
                Save Stripe Config
              </Button>
            </div>
          </div>

          {/* SendGrid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">SendGrid Integration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">SendGrid API Key</label>
                <input
                  type="password"
                  placeholder="SG...."
                  value={apiConfigs.sendgrid?.apiKey || ''}
                  onChange={(e) => handleApiConfigChange('sendgrid', 'apiKey', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={apiConfigs.sendgrid?.status === 'active'}
                    onChange={(e) =>
                      handleApiConfigChange('sendgrid', 'status', e.target.checked ? 'active' : 'inactive')
                    }
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <Button onClick={() => handleSaveApiConfig('sendgrid')} disabled={saving} className="w-full">
                Save SendGrid Config
              </Button>
            </div>
          </div>
        </Card>

        {/* System Alert */}
        <Card className="p-8 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Important</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                API keys are encrypted and stored securely. Never share these keys with anyone. Consider these as passwords.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
