'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { checkServiceHealth } from '@/lib/api-config'
import { SystemHealth } from '@/lib/api-config'
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const SERVICES_TO_CHECK = ['firebase', 'stripe', 'sendgrid']

export default function SystemHealthPage() {
  const [healthStatus, setHealthStatus] = React.useState<SystemHealth[]>([])
  const [loading, setLoading] = React.useState(true)
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null)

  const checkServices = async () => {
    setLoading(true)
    try {
      const results: SystemHealth[] = []
      for (const service of SERVICES_TO_CHECK) {
        const health = await checkServiceHealth(service)
        results.push(health)
      }
      setHealthStatus(results)
      setLastChecked(new Date())
    } catch (error) {
      console.error('[v0] Error checking service health:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    checkServices()
    // Auto-check every 5 minutes
    const interval = setInterval(checkServices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'down':
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
      case 'degraded':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
      case 'down':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
      default:
        return ''
    }
  }

  const overallStatus = healthStatus.every((s) => s.status === 'healthy')
    ? 'all-healthy'
    : healthStatus.some((s) => s.status === 'down')
      ? 'some-down'
      : 'degraded'

  return (
    <>
      <AdminHeader title="System Health" subtitle="Monitor all integrations and services" />
      
      <div className="p-8">
        {/* Overall Status */}
        <Card className={`p-6 mb-8 ${getStatusColor(overallStatus === 'all-healthy' ? 'healthy' : overallStatus === 'some-down' ? 'down' : 'degraded')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(overallStatus === 'all-healthy' ? 'healthy' : overallStatus === 'some-down' ? 'down' : 'degraded')}
              <div>
                <h2 className="text-2xl font-bold">
                  {overallStatus === 'all-healthy'
                    ? 'All Systems Operational'
                    : overallStatus === 'some-down'
                      ? 'Critical Service Down'
                      : 'Service Degradation'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Last checked: {lastChecked?.toLocaleTimeString() || 'Never'}
                </p>
              </div>
            </div>
            <Button onClick={checkServices} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Checking...' : 'Check Now'}
            </Button>
          </div>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {healthStatus.map((service) => (
            <Card key={service.id} className={`p-6 ${getStatusColor(service.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-bold capitalize">{service.serviceName}</h3>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      Status: {service.status}
                    </p>
                    {service.responseTime && (
                      <p className="text-sm text-muted-foreground">
                        Response time: {service.responseTime}ms
                      </p>
                    )}
                    {service.errorMessage && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        Error: {service.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Firebase Note */}
        <Card className="p-6 mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Database Status</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Firebase Firestore health is checked automatically. If your Firestore quota is exceeded, 
            you may experience service degradation. Monitor your usage in Firebase Console.
          </p>
        </Card>

        {/* Service Details */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Service Details</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="pb-4 border-b border-border">
                <p className="font-medium">What is System Health?</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This page monitors the status of all critical services integrated with Passive Blessings. 
                  Each service is checked periodically to ensure everything is running smoothly.
                </p>
              </div>

              <div className="pb-4 border-b border-border">
                <p className="font-medium">Service Status Indicators</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" /> Healthy - Service is operational
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" /> Degraded - Service is slow or partially unavailable
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" /> Down - Service is unavailable
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium">What to do if a service is down?</p>
                <p className="text-sm text-muted-foreground mt-2">
                  1. Check your API keys in Settings<br />
                  2. Verify the service status on their official status page<br />
                  3. Ensure your account has sufficient quota/credits<br />
                  4. Contact support if the issue persists
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
