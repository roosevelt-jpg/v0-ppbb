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

  // Debug logging
  React.useEffect(() => {
    console.log('[v0] Modal serviceId:', serviceId)
    console.log('[v0] Service found:', !!service)
    console.log('[v0] Service fields:', service?.fields?.length || 0)
    console.log('[v0] Full service:', service)
  }, [serviceId, service])

  if (!service) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#111111' }}>
            Service Not Found
          </h2>
          <p className="text-sm" style={{ color: '#888888' }}>
            Could not load service definition for ID: {serviceId}
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
    )
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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Scrollable Content */}
          <div style={{ 
            overflowY: 'auto',
            flex: 1,
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            color: '#111111',
            minHeight: '150px',
          }}>
            {service.fields && service.fields.length > 0 ? (
              service.fields.map((field) => (
                <div key={field.name} style={{ marginBottom: '1.5rem', display: 'block', color: '#111111' }}>
                  <label
                    htmlFor={field.name}
                    style={{ 
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      color: '#111111',
                    }}
                  >
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                  </label>

                  <input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={credentials[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: `1px solid ${errors[field.name] ? '#ef4444' : '#e4e1da'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      color: '#111111',
                      display: 'block',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    aria-invalid={!!errors[field.name]}
                  />

                  {errors[field.name] && (
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#ef4444', display: 'block' }}>
                      {errors[field.name]}
                    </p>
                  )}

                  {field.help && !errors[field.name] && (
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#888888', display: 'block' }}>
                      {field.help}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: '#888888', marginBottom: '1rem' }}>No fields configured for this service. Please check the service configuration.</p>
            )}

            {message && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: message.type === 'success' ? '#065f46' : '#991b1b',
                  display: 'block',
                  marginTop: '1rem',
                }}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid #e4e1da', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
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
