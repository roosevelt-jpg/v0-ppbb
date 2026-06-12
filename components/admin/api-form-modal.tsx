'use client'

import React, { useState } from 'react'
import { getServiceDefinition } from '@/lib/integrations/services'
import { validateApiCredentials, sanitizeCredentials } from '@/lib/integrations/validators'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'

interface ApiFormModalProps {
  serviceId: string
  onSave: (credentials: Record<string, string>) => Promise<void>
  onClose: () => void
  existingCredentials?: Record<string, string>
}

export function ApiFormModal({
  serviceId,
  onSave,
  onClose,
  existingCredentials,
}: ApiFormModalProps) {
  const service = getServiceDefinition(serviceId)
  const [credentials, setCredentials] = useState<Record<string, string>>(
    existingCredentials || {}
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  if (!service) {
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    // Validate
    const validationErrors = validateApiCredentials(serviceId, credentials)
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {}
      validationErrors.forEach((err) => {
        errorMap[err.field] = err.message
      })
      setErrors(errorMap)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const sanitized = sanitizeCredentials(credentials)
      await onSave(sanitized)
      setMessage({ type: 'success', text: `${service.name} configuration saved successfully!` })
      setTimeout(onClose, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save configuration',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleChange(fieldName: string, value: string) {
    setCredentials((prev) => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col"
        style={{ borderColor: '#e4e1da' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b flex-shrink-0"
          style={{ borderColor: '#e4e1da' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#111111' }}>
                {service.name}
              </h2>
              <p className="text-xs mt-1" style={{ color: '#888888' }}>
                Configure your API credentials
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition flex-shrink-0"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {service.fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#111111' }}
                >
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </label>

                <input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm transition focus:outline-none focus:ring-2"
                  style={{
                    borderColor: errors[field.name] ? '#ef4444' : '#e4e1da',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                  aria-invalid={!!errors[field.name]}
                />

                {errors[field.name] && (
                  <p className="text-xs mt-1 text-red-600">
                    {errors[field.name]}
                  </p>
                )}

                {field.help && !errors[field.name] && (
                  <p className="text-xs mt-1" style={{ color: '#888888' }}>
                    {field.help}
                  </p>
                )}
              </div>
            ))}

            {message && (
              <div
                className="p-3 rounded text-sm"
                style={{
                  backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: message.type === 'success' ? '#065f46' : '#991b1b',
                }}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex gap-2 flex-shrink-0" style={{ borderColor: '#e4e1da' }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
