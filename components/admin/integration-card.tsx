'use client'

import React from 'react'
import { ApiConfig, SystemHealth } from '@/lib/types'
import { AlertCircle, CheckCircle, Clock, Edit, Trash2, RefreshCw, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface IntegrationCardProps {
  integration: Partial<ApiConfig>
  health?: SystemHealth
  onEdit: () => void
  onDelete: () => void
  onHealthCheck: () => Promise<void>
  loading?: boolean
}

export function IntegrationCard({
  integration,
  health,
  onEdit,
  onDelete,
  onHealthCheck,
  loading = false,
}: IntegrationCardProps) {
  const [checking, setChecking] = React.useState(false)

  const handleHealthCheck = async () => {
    setChecking(true)
    try {
      await onHealthCheck()
    } finally {
      setChecking(false)
    }
  }

  const isConfigured = integration.apiKey && integration.apiKey !== '***REDACTED***'
  const isActive = integration.status === 'active'

  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200'
    }
  }

  const getHealthIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />
      case 'degraded':
        return <Clock className="w-4 h-4" />
      case 'down':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900 capitalize">
            {integration.serviceName}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            {isConfigured ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Credentials configured
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                Awaiting configuration
              </span>
            )}
          </p>
        </div>
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className="ml-2"
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Health Status */}
      {health && (
        <div className={`mb-4 p-3 border rounded-lg flex items-center gap-2 ${getHealthColor(health.status)}`}>
          {getHealthIcon(health.status)}
          <div className="flex-1">
            <p className="text-sm font-medium capitalize">{health.status}</p>
            {health.responseTime && (
              <p className="text-xs opacity-75">{health.responseTime}ms response time</p>
            )}
            {health.errorMessage && (
              <p className="text-xs opacity-75">{health.errorMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Last Checked */}
      {health?.lastChecked && (
        <p className="text-xs text-neutral-500 mb-4">
          Last checked: {new Date(health.lastChecked).toLocaleString()}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Edit className="w-4 h-4" />
          Configure
        </button>
        <button
          onClick={handleHealthCheck}
          disabled={checking || loading || !isConfigured}
          className="flex-1 px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Check Health
        </button>
        <button
          onClick={onDelete}
          disabled={loading || !isConfigured}
          className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
