'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { IntegrationService, Integration } from '@/lib/integrations/types'
import { X, Loader2 } from 'lucide-react'

interface IntegrationModalProps {
  service: IntegrationService
  integration?: Integration
  onClose: () => void
}

export default function IntegrationModal({ service, integration, onClose }: IntegrationModalProps) {
  const auth = useAuth()
  const [credentials, setCredentials] = useState<Record<string, string>>(integration?.credentials || {})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave() {
    if (!auth.user) return
    setLoading(true)
    try {
      const token = await auth.user.getIdToken()
      const endpoint = integration ? `/api/admin/integrations/${service.id}` : '/api/admin/integrations'
      const method = integration ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, credentials, serviceName: service.name }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully' })
        setTimeout(() => onClose(), 1500)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save' })
      }
    } catch (error) {
      console.error('[v0] Error:', error)
      setMessage({ type: 'error', text: 'Error saving configuration' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.5rem',
            borderBottom: '1.5px solid #e4e1da',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111111' }}>{service.name}</h2>
            <p style={{ fontSize: '0.75rem', color: '#888888', marginTop: '0.25rem' }}>
              Configure your API credentials
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X className="h-5 w-5" style={{ color: '#888888' }} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {service.fields.map((field) => (
            <div key={field.name}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111111',
                  marginBottom: '0.5rem',
                }}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  value={credentials[field.name] || ''}
                  onChange={(e) => setCredentials({ ...credentials, [field.name]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e4e1da',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={credentials[field.name] || ''}
                  onChange={(e) => setCredentials({ ...credentials, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e4e1da',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              ) : (
                <input
                  type={field.type}
                  value={credentials[field.name] || ''}
                  onChange={(e) => setCredentials({ ...credentials, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e4e1da',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                />
              )}

              {field.help && (
                <p style={{ fontSize: '0.75rem', color: '#888888', marginTop: '0.25rem' }}>{field.help}</p>
              )}
            </div>
          ))}

          {message && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: message.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
              }}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e4e1da',
            backgroundColor: '#fafaf8',
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}
