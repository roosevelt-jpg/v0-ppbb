// Form validation for API integrations
import { getServiceDefinition } from './services'

export interface ValidationError {
  field: string
  message: string
}

export function validateApiCredentials(
  serviceName: string,
  credentials: Record<string, any>
): ValidationError[] {
  const service = getServiceDefinition(serviceName)
  if (!service) {
    return [{ field: 'service', message: 'Unknown service' }]
  }

  const errors: ValidationError[] = []

  // Validate each required field
  for (const field of service.fields) {
    const value = credentials[field.name]

    // Check required
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`,
      })
      continue
    }

    // Skip optional empty fields
    if (!field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      continue
    }

    // Validate format
    if (field.validation && value) {
      const regex = new RegExp(field.validation)
      if (!regex.test(String(value))) {
        errors.push({
          field: field.name,
          message: `${field.label} format is invalid`,
        })
      }
    }

    // Validate email
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(String(value))) {
        errors.push({
          field: field.name,
          message: `${field.label} must be a valid email`,
        })
      }
    }

    // Validate URL
    if (field.type === 'url' && value) {
      try {
        new URL(String(value))
      } catch {
        errors.push({
          field: field.name,
          message: `${field.label} must be a valid URL`,
        })
      }
    }
  }

  return errors
}

export function sanitizeCredentials(credentials: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  for (const key in credentials) {
    const value = credentials[key]
    if (typeof value === 'string') {
      // Remove leading/trailing whitespace
      sanitized[key] = value.trim()
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

export function maskSensitiveData(value: string, type: 'password' | 'text' = 'password'): string {
  if (type === 'password') {
    if (value.length <= 4) return '*'.repeat(value.length)
    return value.substring(0, 4) + '*'.repeat(Math.max(3, value.length - 4))
  }
  return value
}
