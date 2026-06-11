import crypto from 'crypto'

// For production, use a secure key management service
// This uses environment variable for demonstration
const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

export function encryptApiKey(plainText: string): EncryptedData {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    )

    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    }
  } catch (error) {
    console.error('[v0] Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export function decryptApiKey(data: EncryptedData): string {
  try {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(data.iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'))

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('[v0] Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey === '***REDACTED***') return '***REDACTED***'
  if (apiKey.length < 8) return '***REDACTED***'

  const visibleLength = Math.min(4, Math.floor(apiKey.length / 4))
  const start = apiKey.substring(0, visibleLength)
  const end = apiKey.substring(apiKey.length - visibleLength)

  return `${start}${'*'.repeat(apiKey.length - 2 * visibleLength)}${end}`
}

export function validateApiKeyFormat(serviceName: string, apiKey: string): boolean {
  if (!apiKey || apiKey.length < 8) return false

  // Service-specific validation
  switch (serviceName) {
    case 'stripe':
      return apiKey.startsWith('sk_') && apiKey.length > 20
    case 'sendgrid':
      return apiKey.startsWith('SG.') && apiKey.length > 50
    case 'anthropic':
      return apiKey.startsWith('sk-') && apiKey.length > 30
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 30
    default:
      return apiKey.length >= 8 && apiKey.length <= 500
  }
}

export function generateAuditHash(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex')
    .substring(0, 16)
}
