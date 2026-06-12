export interface IntegrationService {
  id: string
  name: string
  category: 'payments' | 'backend' | 'calendars' | 'messaging' | 'storage' | 'webhooks'
  description: string
  icon: string
  fields: IntegrationField[]
  docs?: string
}

export interface IntegrationField {
  name: string
  label: string
  type: 'text' | 'password' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  placeholder?: string
  help?: string
  encrypt?: boolean
  options?: Array<{ label: string; value: string }>
}

export interface Integration {
  id: string
  userId: string
  serviceId: string
  serviceName: string
  credentials: Record<string, string>
  status: 'active' | 'inactive' | 'error'
  lastTested?: Date
  lastTestedResult?: 'success' | 'failure'
  createdAt: Date
  updatedAt: Date
  testMessage?: string
}

export interface IntegrationHealth {
  id: string
  serviceId: string
  serviceName: string
  status: 'operational' | 'degraded' | 'down' | 'not_configured'
  latency: number
  lastChecked: Date
  uptime90d: number
  incidentCount: number
}

export interface IntegrationIncident {
  id: string
  serviceId: string
  serviceName: string
  message: string
  severity: 'info' | 'warning' | 'error'
  timestamp: Date
  resolved?: Date
  impact?: string
}
