'use client'

import React from 'react'
import { Save, AlertCircle, CheckCircle, MapPin } from 'lucide-react'

export default function LocationConfigPage() {
  const [config, setConfig] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [formData, setFormData] = React.useState({
    googleMapsApiKey: '',
    googlePlacesApiKey: '',
    enableAutoDetect: true,
    autoDetectRadius: 50,
    defaultCountry: 'AE',
  })

  React.useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      // Read via the Admin SDK API route. Client-side Firestore reads of the
      // protected `admin` collection are denied by security rules.
      const res = await fetch('/api/admin/location-config', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load configuration')
      }

      const data = json.data
      setConfig(data)
      setFormData({
        googleMapsApiKey: data.googleMapsApiKey || '',
        googlePlacesApiKey: data.googlePlacesApiKey || '',
        enableAutoDetect: data.enableAutoDetect ?? true,
        autoDetectRadius: data.autoDetectRadius || 50,
        defaultCountry: data.defaultCountry || 'AE',
      })
    } catch (err) {
      setError('Failed to load configuration. Please try again.')
      console.error('[v0] Error loading location config:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }))
    setSuccess(false)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(false)

      if (!formData.googleMapsApiKey || !formData.googlePlacesApiKey) {
        setError('Both Google Maps and Google Places API keys are required.')
        setIsSaving(false)
        return
      }

      if (formData.autoDetectRadius < 1 || formData.autoDetectRadius > 500) {
        setError('Auto-detect radius must be between 1 and 500 km.')
        setIsSaving(false)
        return
      }

      // Save via the Admin SDK API route (client-side writes to the protected
      // `admin` collection are denied by Firestore security rules).
      const res = await fetch('/api/admin/location-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save configuration')
      }

      setConfig(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration. Please try again.')
      console.error('[v0] Error saving location config:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4"></div>
            <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Google Location API</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Configure location services for user signup and profile management
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">Success</h3>
            <p className="text-sm text-green-700 dark:text-green-400">Configuration saved successfully!</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">API Configuration</h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Google Maps API Key*
            </label>
            <input
              type="password"
              name="googleMapsApiKey"
              value={formData.googleMapsApiKey}
              onChange={handleInputChange}
              placeholder="Enter your Google Maps API key"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Get your API key from Google Cloud Console. Enable Maps JavaScript API.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Google Places API Key*
            </label>
            <input
              type="password"
              name="googlePlacesApiKey"
              value={formData.googlePlacesApiKey}
              onChange={handleInputChange}
              placeholder="Enter your Google Places API key"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Get your API key from Google Cloud Console. Enable Places API.
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 space-y-4">
          <h2 className="text-lg font-semibold">Location Settings</h2>

          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enable Auto-Detection
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Automatically detect user location during signup
              </p>
            </div>
            <input
              type="checkbox"
              name="enableAutoDetect"
              checked={formData.enableAutoDetect}
              onChange={handleInputChange}
              className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Auto-Detection Radius (km)
            </label>
            <input
              type="number"
              name="autoDetectRadius"
              value={formData.autoDetectRadius}
              onChange={handleInputChange}
              min="1"
              max="500"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Search radius for nearby locations (1-500 km)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Default Country Code
            </label>
            <select
              name="defaultCountry"
              value={formData.defaultCountry}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            >
              <option value="AE">United Arab Emirates (AE)</option>
              <option value="US">United States (US)</option>
              <option value="GB">United Kingdom (GB)</option>
              <option value="CA">Canada (CA)</option>
              <option value="AU">Australia (AU)</option>
              <option value="IN">India (IN)</option>
              <option value="SG">Singapore (SG)</option>
              <option value="SA">Saudi Arabia (SA)</option>
              <option value="KSA">Saudi Arabia (KSA)</option>
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Default country to pre-select in signup form
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Setup Instructions</h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
            <li>Go to Google Cloud Console (https://console.cloud.google.com)</li>
            <li>Create a new project or select existing one</li>
            <li>Enable "Maps JavaScript API" and "Places API"</li>
            <li>Create an API key (Application/Browser restriction)</li>
            <li>Copy both API keys from your project credentials</li>
            <li>Paste them above and save</li>
          </ol>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={20} />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}
