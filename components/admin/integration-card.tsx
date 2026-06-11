'use client'

import React from 'react'
import { ApiConfig, SystemHealth } from '@/lib/types'
import { AlertCircle, CheckCircle, Clock, Edit, Trash2, RefreshCw } from 'lucide-react'
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
        return { bg: '#F0F9FF', border: '#E4E1DA', text: '#2E7D32', icon: '#2E7D32' }
      case 'degraded':
        return { bg: '#FFFBF0', border: '#E4E1DA', text: '#E65100', icon: '#E65100' }
      case 'down':
        return { bg: '#FFEBEE', border: '#E4E1DA', text: '#C62828', icon: '#C62828' }
      default:
        return { bg: '#F7F6F2', border: '#E4E1DA', text: '#888888', icon: '#888888' }
    }
  }

  const getHealthIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />
      case 'degraded':
        return <AlertCircle className="w-4 h-4" />
      case 'down':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const healthColors = health ? getHealthColor(health.status) : null

  return (
    <div style={{ borderColor: '#E4E1DA' }} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 style={{ color: '#333333' }} className="font-medium text-base capitalize">
            {integration.serviceName}
          </h3>
          <p style={{ color: '#888888' }} className="text-xs mt-2">
            {isConfigured ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2" style={{ backgroundColor: '#2E7D32' }} className="rounded-full" />
                Credentials configured
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2" style={{ backgroundColor: '#E65100' }} className="rounded-full" />
                Awaiting configuration
              </span>
            )}
          </p>
        </div>
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className="ml-3"
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Health Status */}
      {health && healthColors && (
        <div 
          style={{ 
            backgroundColor: healthColors.bg,
            borderColor: healthColors.border,
            color: healthColors.text
          }}
          className="mb-4 p-3 border rounded-lg flex items-start gap-3"
        >
          <div style={{ color: healthColors.icon }} className="mt-0.5 flex-shrink-0">
            {getHealthIcon(health.status)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium capitalize">{health.status}</p>
            {health.responseTime && (
              <p style={{ color: healthColors.text }} className="text-xs opacity-75 mt-1">{health.responseTime}ms response time</p>
            )}
            {health.errorMessage && (
              <p style={{ color: healthColors.text }} className="text-xs opacity-75 mt-1 break-words">{health.errorMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Last Checked */}
      {health?.lastChecked && (
        <p style={{ color: '#888888' }} className="text-xs mb-4 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last checked: {new Date(health.lastChecked).toLocaleString()}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3" style={{ borderTopColor: '#E4E1DA' }} className="border-t">
        <button
          onClick={onEdit}
          disabled={loading}
          style={{ 
            backgroundColor: '#F7F6F2',
            borderColor: '#E4E1DA',
            color: '#1565C0'
          }}
          className="flex-1 px-3 py-2 border rounded-lg hover:shadow-sm transition text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Edit className="w-3 h-3" />
          Configure
        </button>
        <button
          onClick={handleHealthCheck}
          disabled={checking || loading || !isConfigured}
          style={{ 
            backgroundColor: '#F7F6F2',
            borderColor: '#E4E1DA',
            color: '#1565C0'
          }}
          className="flex-1 px-3 py-2 border rounded-lg hover:shadow-sm transition text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          Check Health
        </button>
        <button
          onClick={onDelete}
          disabled={loading || !isConfigured}
          style={{ 
            backgroundColor: '#F7F6F2',
            borderColor: '#E4E1DA',
            color: '#C62828'
          }}
          className="px-3 py-2 border rounded-lg hover:shadow-sm transition text-xs font-medium disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
