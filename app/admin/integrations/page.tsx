'use client'

import React, { useState, useEffect } from 'react'
import { ApiConfig, SystemHealth } from '@/lib/types'
import { IntegrationCard } from '@/components/admin/integration-card'
import { IntegrationForm } from '@/components/admin/integration-form'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, AlertCircle, CheckCircle, Zap, Database, TrendingUp, Clock } from 'lucide-react'

// Define available integrations
const AVAILABLE_INTEGRATIONS: Record<string, { name: string; description: string; icon: string }> = {
  anthropic: {
    name: 'Anthropic Claude',
    description: 'AI chatbot and content generation',
    icon: '🤖',
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT models for AI features',
    icon: '🧠',
  },
  stripe: {
    name: 'Stripe',
    description: 'Payment processing',
    icon: '💳',
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Email service',
    icon: '📧',
  },
  youtube: {
    name: 'YouTube',
    description: 'Video integration',
    icon: '▶️',
  },
  google_maps: {
    name: 'Google Maps',
    description: 'Location services',
    icon: '📍',
  },
  twilio: {
    name: 'Twilio',
    description: 'SMS and phone services',
    icon: '📱',
  },
  paypal: {
    name: 'PayPal',
    description: 'Alternative payment gateway',
    icon: '🅿️',
  },
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Partial<ApiConfig>[]>([])
  const [healthStatus, setHealthStatus] = useState<Record<string, SystemHealth>>({})
  const [loading, setLoading] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState<Partial<ApiConfig> | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/integrations')
      const data = await response.json()
      setIntegrations(data.configs || [])

      // Load health status for all
      for (const service of Object.keys(AVAILABLE_INTEGRATIONS)) {
        await checkHealth(service)
      }
    } catch (error) {
      console.error('[v0] Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkHealth = async (serviceName: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/${serviceName}/health`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.health) {
        setHealthStatus(prev => ({
          ...prev,
          [serviceName]: data.health,
        }))
      }
    } catch (error) {
      console.error('[v0] Error checking health for', serviceName, error)
    }
  }

  const handleEditIntegration = (serviceName: string) => {
    const existing = integrations.find(i => i.serviceName === serviceName)
    setSelectedIntegration({
      serviceName,
      ...existing,
    })
    setShowForm(true)
  }

  const handleAddIntegration = (serviceName: string) => {
    setSelectedIntegration({
      serviceName,
      status: 'inactive',
    })
    setShowForm(true)
  }

  const handleSaveIntegration = async (config: Partial<ApiConfig>) => {
    try {
      const response = await fetch(
        `/api/admin/integrations/${config.serviceName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save integration')
      }

      await loadIntegrations()
      setShowForm(false)
      setSelectedIntegration(null)
    } catch (error) {
      console.error('[v0] Error saving integration:', error)
      throw error
    }
  }

  const handleDeleteIntegration = async (serviceName: string) => {
    if (!confirm(`Delete configuration for ${serviceName}?`)) return

    try {
      const response = await fetch(`/api/admin/integrations/${serviceName}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete integration')
      }

      await loadIntegrations()
    } catch (error) {
      console.error('[v0] Error deleting integration:', error)
    }
  }

  const configuredCount = integrations.filter(i => i.apiKey).length
  const activeCount = integrations.filter(i => i.status === 'active').length

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">API Integrations</h1>
          <p className="text-neutral-600 mt-2">
            Manage all external service credentials and integrations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 font-medium">Total Integrations</p>
            <p className="text-3xl font-bold text-neutral-900 mt-2">
              {Object.keys(AVAILABLE_INTEGRATIONS).length}
            </p>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 font-medium">Configured</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{configuredCount}</p>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
          </Card>
        </div>

        {/* Integrations Grid */}
        <div className="space-y-6">
          {/* Configured Integrations */}
          {integrations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Configured Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map(integration => (
                  <IntegrationCard
                    key={integration.serviceName}
                    integration={integration}
                    health={healthStatus[integration.serviceName || '']}
                    onEdit={() => handleEditIntegration(integration.serviceName || '')}
                    onDelete={() => handleDeleteIntegration(integration.serviceName || '')}
                    onHealthCheck={() => checkHealth(integration.serviceName || '')}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Integrations */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Available Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(AVAILABLE_INTEGRATIONS).map(([key, integration]) => {
                const isConfigured = integrations.some(i => i.serviceName === key)
                if (isConfigured) return null

                return (
                  <Card
                    key={key}
                    className="p-5 border border-neutral-200 hover:shadow-md transition cursor-pointer"
                    onClick={() => handleAddIntegration(key)}
                  >
                    <div className="text-3xl mb-2">{integration.icon}</div>
                    <h3 className="font-semibold text-neutral-900">{integration.name}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{integration.description}</p>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleAddIntegration(key)
                      }}
                      className="mt-4 w-full px-3 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Integration Form Modal */}
        {showForm && selectedIntegration && (
          <IntegrationForm
            integration={selectedIntegration}
            onSave={handleSaveIntegration}
            onClose={() => {
              setShowForm(false)
              setSelectedIntegration(null)
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}
