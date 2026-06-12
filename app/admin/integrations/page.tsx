'use client'

import React, { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { getAllServiceDefinitions } from '@/lib/integrations/services'
import { ApiCard } from '@/components/admin/api-card'
import { ApiFormModal } from '@/components/admin/api-form-modal'
import { ApiConfig, SystemHealth } from '@/lib/types'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BUTTON_PRIMARY } from '@/lib/admin-design-system'

export const dynamic = 'force-dynamic'

export default function AdminIntegrationsPage() {
  const services = getAllServiceDefinitions()
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [healthStatus, setHealthStatus] = useState<SystemHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/integrations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConfigs(data.configs || [])
          setHealthStatus(data.health || [])
        } else {
          console.error('[v0] API returned error:', data.error)
          setConfigs([])
          setHealthStatus([])
        }
      } else {
        console.error('[v0] API error:', response.status, response.statusText)
        setConfigs([])
        setHealthStatus([])
      }
      setLoading(false)
    } catch (error) {
      console.error('[v0] Error loading integrations:', error)
      setConfigs([])
      setHealthStatus([])
      setLoading(false)
    }
  }

  function handleEdit(serviceId: string) {
    setSelectedService(serviceId)
    setShowModal(true)
  }

  async function handleSaveConfig(serviceId: string, credentials: Record<string, any>) {
    try {
      const response = await fetch(`/api/admin/integrations/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        await loadData()
        setShowModal(false)
        setSelectedService(null)
      } else {
        const error = await response.json()
        console.error('[v0] Error saving config:', error)
      }
    } catch (error) {
      console.error('[v0] Error saving config:', error)
    }
  }

  async function handleTestService(serviceId: string) {
    try {
      const response = await fetch(`/api/admin/integrations/${serviceId}/test`, {
        method: 'POST',
      })

      if (response.ok) {
        await loadData()
      } else {
        console.error('[v0] Test failed')
      }
    } catch (error) {
      console.error('[v0] Error testing service:', error)
    }
  }

  async function handleDeleteConfig(serviceId: string) {
    if (!confirm(`Delete ${serviceId} configuration?`)) return

    try {
      const response = await fetch(`/api/admin/integrations/${serviceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadData()
      } else {
        console.error('[v0] Delete failed')
      }
    } catch (error) {
      console.error('[v0] Error deleting config:', error)
    }
  }

  function isConfigured(serviceId: string): boolean {
    return configs.some((c) => c.serviceName === serviceId)
  }

  function getHealth(serviceId: string): SystemHealth | undefined {
    return healthStatus.find((h) => h.serviceName === serviceId)
  }

  const configuredCount = configs.length
  const healthyCount = healthStatus.filter((h) => h.status === 'healthy').length

  return (
    <AdminPageLayout title="Integrations" subtitle="Manage and configure all integrated services">
      <div className="space-y-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Configured Services</div>
            <div className="text-3xl font-bold mt-2 text-neutral-900">{configuredCount}</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Healthy Services</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{healthyCount}</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Available Services</div>
            <div className="text-3xl font-bold mt-2 text-neutral-900">{services.length}</div>
          </div>
        </div>

        {/* Current Configurations Section */}
        {!loading && configuredCount > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111111' }}>
              Current Configurations
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {configs.map((config) => {
                const service = services.find(s => s.id === config.serviceName)
                const health = getHealth(config.serviceName)
                
                return (
                  <div
                    key={config.serviceName}
                    style={{
                      border: '1px solid #e4e1da',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111111', margin: '0' }}>
                        {service?.name || config.serviceName}
                      </h3>
                      <span style={{
                        backgroundColor: health?.status === 'healthy' ? '#d1fae5' : '#fee2e2',
                        color: health?.status === 'healthy' ? '#065f46' : '#991b1b',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        {health?.status === 'healthy' ? 'Active' : 'Error'}
                      </span>
                    </div>

                    {service?.description && (
                      <p style={{
                        fontSize: '13px',
                        color: '#888888',
                        margin: '0 0 12px 0',
                      }}>
                        {service.description}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}>
                      <button
                        onClick={() => handleEdit(config.serviceName)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#111111',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTestService(config.serviceName)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e4e1da',
                          color: '#111111',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.serviceName)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={loadData}
            className={`${BUTTON_PRIMARY} flex items-center gap-2`}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}

        {/* Add New Configuration Section */}
        {!loading && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111111' }}>
              Add New Configuration
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {services.map((service) => {
                const serviceIsConfigured = isConfigured(service.id)
                
                return (
                  <div
                    key={service.id}
                    style={{
                      border: '1px solid #e4e1da',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: serviceIsConfigured ? '#f5f5f5' : '#ffffff',
                      opacity: serviceIsConfigured ? 0.7 : 1,
                    }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111111', margin: '0 0 8px 0' }}>
                      {service.name}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: '#888888',
                      margin: '0 0 16px 0',
                    }}>
                      {service.description}
                    </p>

                    {serviceIsConfigured ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#333333',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'not-allowed',
                        }}
                      >
                        ✓ Already Configured
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(service.id)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#111111',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        + Configure
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && selectedService && (
          <ApiFormModal
            serviceId={selectedService}
            onSave={async (credentials) => {
              await handleSaveConfig(selectedService, credentials)
            }}
            onClose={() => {
              setShowModal(false)
              setSelectedService(null)
            }}
          />
        )}
      </div>
    </AdminPageLayout>
  )
}
