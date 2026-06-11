'use client'

import React, { useState, useEffect } from 'react'
import { getAllServiceDefinitions } from '@/lib/integrations/services'
import { getAllApiConfigs, checkAllServicesHealth } from '@/lib/api-config'
import { ApiCard } from '@/components/admin/api-card'
import { ApiFormModal } from '@/components/admin/api-form-modal'
import { ApiConfig, SystemHealth } from '@/lib/types'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      const [configsData, healthData] = await Promise.all([
        getAllApiConfigs(),
        checkAllServicesHealth(),
      ])
      setConfigs(configsData)
      setHealthStatus(healthData)
      setLoading(false)
    } catch (error) {
      console.error('[v0] Error loading integrations:', error)
      setLoading(false)
    }
  }

  function handleEdit(serviceId: string) {
    setSelectedService(serviceId)
    setShowModal(true)
  }

  function handleDelete(serviceId: string) {
    if (confirm(`Delete ${serviceId} configuration?`)) {
      console.log('Delete', serviceId)
    }
  }

  function handleTest(serviceId: string) {
    console.log('Test', serviceId)
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
    <div className="p-8 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="text-xs font-semibold" style={{ color: '#888888' }}>
            Configured Services
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#111111' }}>
            {configuredCount}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="text-xs font-semibold" style={{ color: '#888888' }}>
            Healthy Services
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#10b981' }}>
            {healthyCount}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="text-xs font-semibold" style={{ color: '#888888' }}>
            Available Services
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#111111' }}>
            {services.length}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111111' }}>
            API Integrations
          </h2>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            Manage and configure all integrated services
          </p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTest={handleTest}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedService && (
        <ApiFormModal
          serviceId={selectedService}
          onSave={async (credentials) => {
            console.log('Save credentials for', selectedService, credentials)
            setShowModal(false)
            await loadData()
          }}
          onClose={() => {
            setShowModal(false)
            setSelectedService(null)
          }}
        />
      )}
    </div>
  )
}
