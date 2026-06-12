import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-dev-key-change-in-prod-32chars!!'
const IV_LENGTH = 16

export function encryptField(value: string): string {
  if (!value) return value
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32)), iv)
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('[v0] Encryption error:', error)
    return value
  }
}

export function decryptField(encrypted: string): string {
  if (!encrypted || !encrypted.includes(':')) return encrypted
  try {
    const parts = encrypted.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32)), iv)
    let decrypted = decipher.update(parts[1], 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('[v0] Decryption error:', error)
    return encrypted
  }
}

export function encryptCredentials(credentials: Record<string, string>, serviceId: string): Record<string, string> {
  const { getServiceDefinition } = require('./services')
  const service = getServiceDefinition(serviceId)
  if (!service) return credentials

  const encrypted: Record<string, string> = {}
  for (const [key, value] of Object.entries(credentials)) {
    const field = service.fields.find((f: any) => f.name === key)
    if (field?.encrypt) {
      encrypted[key] = encryptField(value)
    } else {
      encrypted[key] = value
    }
  }
  return encrypted
}

export function decryptCredentials(credentials: Record<string, string>, serviceId: string): Record<string, string> {
  const { getServiceDefinition } = require('./services')
  const service = getServiceDefinition(serviceId)
  if (!service) return credentials

  const decrypted: Record<string, string> = {}
  for (const [key, value] of Object.entries(credentials)) {
    const field = service.fields.find((f: any) => f.name === key)
    if (field?.encrypt) {
      decrypted[key] = decryptField(value)
    } else {
      decrypted[key] = value
    }
  }
  return decrypted
}

export function redactCredentials(credentials: Record<string, string>, serviceId: string): Record<string, string> {
  const { getServiceDefinition } = require('./services')
  const service = getServiceDefinition(serviceId)
  if (!service) return credentials

  const redacted: Record<string, string> = {}
  for (const [key, value] of Object.entries(credentials)) {
    const field = service.fields.find((f: any) => f.name === key)
    if (field?.encrypt) {
      redacted[key] = value ? '***' + value.slice(-4) : '***'
    } else {
      redacted[key] = value
    }
  }
  return redacted
}
