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
    <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-xl hover:border-neutral-300 transition-all duration-300 group overflow-hidden relative">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/50 transition-all duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-neutral-900 capitalize group-hover:text-blue-600 transition-colors">
              {integration.serviceName}
            </h3>
            <p className="text-sm text-neutral-600 mt-2">
              {isConfigured ? (
                <span className="flex items-center gap-2 text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Credentials configured
                </span>
              ) : (
                <span className="flex items-center gap-2 text-amber-700">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  Awaiting configuration
                </span>
              )}
            </p>
          </div>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className="ml-2 font-semibold"
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Health Status */}
        {health && (
          <div className={`mb-5 p-4 border-l-4 rounded-lg flex items-start gap-3 ${getHealthColor(health.status)}`}>
            <div className="mt-0.5">
              {getHealthIcon(health.status)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold capitalize">{health.status}</p>
              {health.responseTime && (
                <p className="text-xs opacity-75 mt-1">{health.responseTime}ms response time</p>
              )}
              {health.errorMessage && (
                <p className="text-xs opacity-75 mt-1">{health.errorMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* Last Checked */}
        {health?.lastChecked && (
          <p className="text-xs text-neutral-500 mb-5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last checked: {new Date(health.lastChecked).toLocaleString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-neutral-100">
          <button
            onClick={onEdit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-md"
          >
            <Edit className="w-4 h-4" />
            Configure
          </button>
          <button
            onClick={handleHealthCheck}
            disabled={checking || loading || !isConfigured}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            Check
          </button>
          <button
            onClick={onDelete}
            disabled={loading || !isConfigured}
            className="px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 rounded-lg hover:from-red-100 hover:to-red-200 transition-all duration-200 text-sm font-semibold disabled:opacity-50 hover:shadow-md"
            title="Delete configuration"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
