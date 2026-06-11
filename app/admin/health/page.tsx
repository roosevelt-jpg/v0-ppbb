import React from 'react'
import { getAllServiceDefinitions } from '@/lib/integrations/services'
import { checkAllServicesHealth, getAllApiConfigs } from '@/lib/api-config'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SystemHealthPage() {
  const allServices = getAllServiceDefinitions()
  const [configuredServices, healthStatus] = await Promise.all([
    getAllApiConfigs(),
    checkAllServicesHealth(),
  ])

  const getServiceStatus = (serviceId: string) => {
    const health = healthStatus.find((h) => h.serviceName === serviceId)
    const isConfigured = configuredServices.some((c) => c.serviceName === serviceId)
    return {
      health,
      isConfigured,
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'down':
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusColor = (isConfigured: boolean, status?: string) => {
    if (!isConfigured) return 'bg-gray-50 border-gray-200'
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200'
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200'
      case 'down':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const configuredCount = configuredServices.length
  const healthyCount = healthStatus.filter((h) => h.status === 'healthy').length
  const degradedCount = healthStatus.filter((h) => h.status === 'degraded').length
  const downCount = healthStatus.filter((h) => h.status === 'down').length

  const overallStatus =
    downCount > 0
      ? 'down'
      : degradedCount > 0
        ? 'degraded'
        : configuredCount > 0
          ? 'healthy'
          : 'unconfigured'

  return (
    <div className="p-8 space-y-8">
      {/* Overall Status Alert */}
      {overallStatus === 'down' && (
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
          }}
        >
          <div className="flex items-start gap-4">
            <XCircle style={{ color: '#dc2626', minWidth: '24px' }} />
            <div>
              <h3
                className="font-bold text-lg"
                style={{ color: '#dc2626' }}
              >
                Critical Service Down
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: '#991b1b' }}
              >
                Last checked: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="text-xs font-semibold" style={{ color: '#888888' }}>
            Configured
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#111111' }}>
            {configuredCount}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="text-xs font-semibold" style={{ color: '#888888' }}>
            Healthy
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#10b981' }}>
            {healthyCount}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="text-xs font-semibold" style={{ color: '#888888' }}>
            Degraded
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#f59e0b' }}>
            {degradedCount}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2' }}>
          <div className="text-xs font-semibold" style={{ color: '#888888' }}>
            Down
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#ef4444' }}>
            {downCount}
          </div>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#111111' }}>
          Service Health Status
        </h2>
        <p className="text-sm mt-1" style={{ color: '#888888' }}>
          Real-time monitoring of all configured integrations
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allServices.map((service) => {
          const { health, isConfigured } = getServiceStatus(service.id)
          const statusText = !isConfigured
            ? 'Not Configured'
            : health?.status === 'healthy'
              ? 'Connected'
              : health?.status === 'degraded'
                ? 'Degraded'
                : 'Disconnected'

          return (
            <div
              key={service.id}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: getStatusColor(isConfigured, health?.status).includes('green')
                  ? '#ecfdf5'
                  : getStatusColor(isConfigured, health?.status).includes('yellow')
                    ? '#fefce8'
                    : getStatusColor(isConfigured, health?.status).includes('red')
                      ? '#fef2f2'
                      : '#f9fafb',
                borderColor: getStatusColor(isConfigured, health?.status).includes('green')
                  ? '#a7f3d0'
                  : getStatusColor(isConfigured, health?.status).includes('yellow')
                    ? '#fef08a'
                    : getStatusColor(isConfigured, health?.status).includes('red')
                      ? '#fecaca'
                      : '#e5e7eb',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(health?.status || 'down')}
                  <div>
                    <h3 className="font-bold" style={{ color: '#111111' }}>
                      {service.name}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: '#888888' }}>
                      {service.category}
                    </p>
                    {isConfigured && (
                      <p
                        className="text-xs font-semibold mt-2"
                        style={{
                          color:
                            health?.status === 'healthy'
                              ? '#059669'
                              : health?.status === 'degraded'
                                ? '#d97706'
                                : '#dc2626',
                        }}
                      >
                        {statusText}
                      </p>
                    )}
                    {!isConfigured && (
                      <p className="text-xs font-semibold mt-2" style={{ color: '#6b7280' }}>
                        {statusText}
                      </p>
                    )}
                    {health?.responseTime && (
                      <p className="text-xs mt-2" style={{ color: '#888888' }}>
                        Response: {health.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Information Box */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h3 className="font-bold" style={{ color: '#1e40af' }}>
          Service Health Information
        </h3>
        <ul className="text-sm mt-3 space-y-2" style={{ color: '#1e40af' }}>
          <li className="flex gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>
              <strong>Connected</strong> - Service is properly configured and responding
            </span>
          </li>
          <li className="flex gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>
              <strong>Degraded</strong> - Service is slow or partially unavailable
            </span>
          </li>
          <li className="flex gap-2">
            <XCircle className="h-4 w-4" />
            <span>
              <strong>Disconnected</strong> - Service is down or not responding
            </span>
          </li>
          <li className="flex gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>
              <strong>Not Configured</strong> - Service API keys are not configured
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
