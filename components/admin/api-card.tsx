'use client'

import React from 'react'
import { ServiceDefinition } from '@/lib/integrations/services'
import { SystemHealth } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Edit2,
  Trash2,
  Power,
  AlertCircle,
  CheckCircle2,
  Clock,
  Brain,
  Zap,
  CreditCard,
  Mail,
  PlayCircle,
  MapPin,
  Database,
  Calendar,
  Plug,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Brain,
  Zap,
  CreditCard,
  Mail,
  PlayCircle,
  MapPin,
  Database,
  Calendar,
  Plug,
}

interface ApiCardProps {
  service: ServiceDefinition
  isConfigured: boolean
  health?: SystemHealth
  onEdit: (serviceId: string) => void
  onDelete: (serviceId: string) => void
  onTest: (serviceId: string) => void
}

export function ApiCard({
  service,
  isConfigured,
  health,
  onEdit,
  onDelete,
  onTest,
}: ApiCardProps) {
  const Icon = ICON_MAP[service.icon] || Power

  return (
    <Card className="p-6 flex flex-col h-full" style={{ borderColor: '#e4e1da' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: '#f7f6f2' }}
          >
            <Icon className="h-6 w-6" style={{ color: '#111111' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#111111' }}>
              {service.name}
            </h3>
            <p className="text-xs" style={{ color: '#888888' }}>
              {service.category}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1">
          {isConfigured && health ? (
            <>
              {health.status === 'healthy' && (
                <CheckCircle2 className="h-5 w-5" style={{ color: '#10b981' }} />
              )}
              {health.status === 'degraded' && (
                <AlertCircle className="h-5 w-5" style={{ color: '#f59e0b' }} />
              )}
              {health.status === 'down' && (
                <AlertCircle className="h-5 w-5" style={{ color: '#ef4444' }} />
              )}
            </>
          ) : (
            <Clock className="h-5 w-5" style={{ color: '#d1d5db' }} />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs flex-1 mb-4" style={{ color: '#666666' }}>
        {service.description}
      </p>

      {/* Health Status */}
      {isConfigured && health && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: '#111111' }}>
              Status: {health.status.toUpperCase()}
            </span>
            {health.responseTime && (
              <span className="text-xs" style={{ color: '#888888' }}>
                {health.responseTime}ms
              </span>
            )}
          </div>
          {health.errorMessage && (
            <p className="text-xs" style={{ color: '#ef4444' }}>
              {health.errorMessage}
            </p>
          )}
          {health.lastChecked && (
            <p className="text-xs" style={{ color: '#888888' }}>
              Last checked: {new Date(health.lastChecked).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isConfigured ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onEdit(service.id)}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onTest(service.id)}
            >
              <Power className="h-3 w-3 mr-1" />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={() => onEdit(service.id)}
            style={{ backgroundColor: '#111111', color: '#ffffff' }}
          >
            Add Configuration
          </Button>
        )}
      </div>
    </Card>
  )
}
