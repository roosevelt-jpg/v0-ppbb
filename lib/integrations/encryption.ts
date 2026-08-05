import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-dev-key-change-in-prod-32chars!!'
const IV_LENGTH = 16

export function encryptField(value: string): string {
  if (!value) return value
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32))
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('[v0] Encryption error:', error)
    return value
  }
}

export function decryptField(encrypted: string): string {
  if (encrypted == null) return ''
  const value = typeof encrypted === 'string' ? encrypted : String(encrypted)
  if (!value || !value.includes(':')) return value
  try {
    const parts = value.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32))
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(parts[1], 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('[v0] Decryption error:', error)
    return value
  }
}

// Field-level encryption map (hardcoded to avoid circular imports)
const ENCRYPTED_FIELDS: Record<string, Set<string>> = {
  paypal: new Set(['clientSecret']),
  stripe: new Set(['secretKey', 'webhookSecret']),
  stripeHosting: new Set(['secretKey', 'webhookSecret']),
  ziina: new Set(['apiKey', 'apiSecret', 'webhookSecret']),
  firebase: new Set(['privateKey']),
  googleAuth: new Set(['webClientSecret']),
  facebookAuth: new Set(['appSecret']),
  googleCalendar: new Set(['refreshToken', 'accessToken']),
  microsoftCalendar: new Set(['refreshToken', 'accessToken']),
  appleCalendar: new Set(['refreshToken']),
  whatsapp: new Set(['accessToken', 'webhookSecret']),
  sendgrid: new Set(['apiKey']),
  twilio: new Set(['authToken']),
  googleMaps: new Set(['apiKey']),
  gmailSmtp: new Set(['gmailAppPassword']),
  cloudStorage: new Set(['secretAccessKey']),
  googleCloudStorage: new Set(['serviceAccountJson']),
  googleDrive: new Set(['serviceAccountJson']),
  youtubeApi: new Set(['apiKey']),
  googleAnalytics: new Set(['serviceAccountKey']),
  customWebhook: new Set(['secret']),
}

export function encryptCredentials(credentials: Record<string, string>, serviceId: string): Record<string, string> {
  const encryptedFields = ENCRYPTED_FIELDS[serviceId] || new Set()
  const encrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(credentials)) {
    if (encryptedFields.has(key) && value) {
      encrypted[key] = encryptField(value)
    } else {
      encrypted[key] = value
    }
  }
  return encrypted
}

export function decryptCredentials(credentials: Record<string, string>, serviceId: string): Record<string, string> {
  const encryptedFields = ENCRYPTED_FIELDS[serviceId] || new Set()
  const decrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(credentials)) {
    if (encryptedFields.has(key) && value) {
      decrypted[key] = decryptField(value)
    } else {
      decrypted[key] = value
    }
  }
  return decrypted
}

export function redactCredentials(credentials: Record<string, string>, serviceId: string): Record<string, string> {
  const encryptedFields = ENCRYPTED_FIELDS[serviceId] || new Set()
  const redacted: Record<string, string> = {}

  for (const [key, value] of Object.entries(credentials)) {
    if (encryptedFields.has(key)) {
      redacted[key] = value ? '***' + value.slice(-4) : '***'
    } else {
      redacted[key] = value
    }
  }
  return redacted
}
