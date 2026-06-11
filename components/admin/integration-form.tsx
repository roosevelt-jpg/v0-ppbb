'use client'

import React, { useState } from 'react'
import { ApiConfig } from '@/lib/types'
import { Save, X, Eye, EyeOff } from 'lucide-react'

interface IntegrationFormProps {
  integration: Partial<ApiConfig>
  onSave: (config: Partial<ApiConfig>) => Promise<void>
  onClose: () => void
  loading?: boolean
}

export function IntegrationForm({
  integration,
  onSave,
  onClose,
  loading = false,
}: IntegrationFormProps) {
  const [formData, setFormData] = useState<Partial<ApiConfig>>(integration)
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.apiKey?.trim()) {
      setError('API Key is required')
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900">
            Configure {formData.serviceName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded transition"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Service
            </label>
            <input
              type="text"
              value={formData.serviceName || ''}
              disabled
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={formData.apiKey || ''}
                onChange={e => handleChange('apiKey', e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-700"
              >
                {showSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* API Secret (if applicable) */}
          {formData.apiSecret !== undefined && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                API Secret (optional)
              </label>
              <input
                type={showSecret ? 'text' : 'password'}
                value={formData.apiSecret || ''}
                onChange={e => handleChange('apiSecret', e.target.value)}
                placeholder="Enter your API secret"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Endpoint (if applicable) */}
          {formData.endpoint !== undefined && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Endpoint (optional)
              </label>
              <input
                type="url"
                value={formData.endpoint || ''}
                onChange={e => handleChange('endpoint', e.target.value)}
                placeholder="https://api.example.com"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              value={formData.status || 'inactive'}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
