'use client'

import React, { useState } from 'react'
import { IntegrationService, Integration } from '@/lib/integrations/types'
import { ChevronDown, AlertCircle } from 'lucide-react'
import IntegrationModal from './integration-modal'

interface IntegrationCardProps {
  service: IntegrationService
  integration?: Integration
  health?: any
  onRefresh: () => void
}

export function IntegrationCard({ service, integration, health, onRefresh }: IntegrationCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfiguring, setIsConfiguring] = useState(false)

  const statusColor = integration?.status === 'active' ? '#10b981' : integration?.status === 'error' ? '#ef4444' : '#888888'
  const statusLabel = integration?.status === 'active' ? 'Active' : integration?.status === 'error' ? 'Error' : 'Inactive'

  return (
    <>
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d4d1ca')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e4e1da')}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{service.icon}</span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111111' }}>{service.name}</h3>
              <p style={{ fontSize: '0.75rem', color: '#888888' }}>{service.description}</p>
            </div>
          </div>
          <span
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: integration ? statusColor + '20' : '#f3f3f1',
              color: statusColor,
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            {integration ? statusLabel : 'Inactive'}
          </span>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#f9f8f5',
            border: '1px solid #e4e1da',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#111111',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f3f1')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f9f8f5')}
        >
          {isOpen ? 'Hide Details' : 'Show Details'}
          <ChevronDown
            className="h-4 w-4"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          />
        </button>

        {/* Collapsible Content */}
        {isOpen && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e4e1da' }}>
            {integration ? (
              <>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {health && (
                    <>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.25rem' }}>Latency</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>{health.latency}ms</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.25rem' }}>Uptime (90d)</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>{health.uptime90d}%</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.25rem' }}>Last Checked</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>
                          {health.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setIsConfiguring(true)}
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
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#f9f8f5',
                      color: '#111111',
                      border: '1px solid #e4e1da',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <AlertCircle className="h-6 w-6" style={{ margin: '0 auto 0.5rem', color: '#888888' }} />
                <p style={{ fontSize: '0.875rem', color: '#888888', marginBottom: '1rem' }}>Not configured</p>
                <button
                  onClick={() => setIsConfiguring(true)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#111111',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Configure Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isConfiguring && (
        <IntegrationModal
          service={service}
          integration={integration}
          onClose={() => {
            setIsConfiguring(false)
            onRefresh()
          }}
        />
      )}
    </>
  )
}
