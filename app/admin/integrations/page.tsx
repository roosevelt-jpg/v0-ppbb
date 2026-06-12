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
      <div className="space-y-8 max-w-7xl">
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

        {/* Services Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ApiCard
                key={service.id}
                service={service}
                isConfigured={isConfigured(service.id)}
                health={getHealth(service.id)}
                onEdit={() => handleEdit(service.id)}
                onDelete={() => handleDeleteConfig(service.id)}
                onTest={() => handleTestService(service.id)}
              />
            ))}
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
