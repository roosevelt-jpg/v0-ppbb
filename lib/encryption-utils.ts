import crypto from 'crypto'

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 64
const IV_LENGTH = 16
const TAG_LENGTH = 16
const PBKDF2_ITERATIONS = 100000

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns encrypted data with IV, salt, and auth tag
 */
export function encryptSensitiveData(
  data: string | Buffer,
  encryptionKey: string
): { encrypted: string; iv: string; salt: string; tag: string } {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive encryption key from password using PBKDF2
    const key = crypto.pbkdf2Sync(encryptionKey, salt, PBKDF2_ITERATIONS, 32, 'sha256')

    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

    // Encrypt data
    const bufferData = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data
    let encrypted = cipher.update(bufferData)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    // Get authentication tag
    const tag = cipher.getAuthTag()

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      tag: tag.toString('base64'),
    }
  } catch (error) {
    console.error('[v0] Encryption error:', error)
    throw new Error('Failed to encrypt sensitive data')
  }
}

/**
 * Decrypt sensitive data that was encrypted with encryptSensitiveData
 */
export function decryptSensitiveData(
  encrypted: string,
  iv: string,
  salt: string,
  tag: string,
  encryptionKey: string
): string {
  try {
    // Recover components
    const encryptedBuffer = Buffer.from(encrypted, 'base64')
    const ivBuffer = Buffer.from(iv, 'base64')
    const saltBuffer = Buffer.from(salt, 'base64')
    const tagBuffer = Buffer.from(tag, 'base64')

    // Derive same key using same salt
    const key = crypto.pbkdf2Sync(encryptionKey, saltBuffer, PBKDF2_ITERATIONS, 32, 'sha256')

    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, ivBuffer)
    decipher.setAuthTag(tagBuffer)

    // Decrypt data
    let decrypted = decipher.update(encryptedBuffer)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf-8')
  } catch (error) {
    console.error('[v0] Decryption error:', error)
    throw new Error('Failed to decrypt sensitive data - possible tampering or wrong key')
  }
}

/**
 * Generate SHA-256 hash of a file for integrity verification
 */
export function generateFileHash(fileBuffer: Buffer): string {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex')
}

/**
 * Verify file integrity using hash
 */
export function verifyFileHash(fileBuffer: Buffer, expectedHash: string): boolean {
  const actualHash = generateFileHash(fileBuffer)
  return actualHash === expectedHash
}

/**
 * Generate secure document ID
 */
export function generateSecureDocumentId(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Encrypt sensitive object fields
 * Useful for storing objects with sensitive fields partially encrypted
 */
export function encryptObjectFields(
  obj: Record<string, any>,
  fieldsToEncrypt: string[],
  encryptionKey: string
): Record<string, any> {
  const encrypted = { ...obj }

  for (const field of fieldsToEncrypt) {
    if (encrypted[field]) {
      const encryptionResult = encryptSensitiveData(JSON.stringify(encrypted[field]), encryptionKey)
      encrypted[`${field}_encrypted`] = {
        data: encryptionResult.encrypted,
        iv: encryptionResult.iv,
        salt: encryptionResult.salt,
        tag: encryptionResult.tag,
      }
      delete encrypted[field] // Remove unencrypted version
    }
  }

  return encrypted
}

/**
 * Decrypt sensitive object fields
 */
export function decryptObjectFields(
  obj: Record<string, any>,
  fieldsToDecrypt: string[],
  encryptionKey: string
): Record<string, any> {
  const decrypted = { ...obj }

  for (const field of fieldsToDecrypt) {
    const encryptedField = `${field}_encrypted`
    if (decrypted[encryptedField]) {
      const encryptionData = decrypted[encryptedField]
      const decryptedValue = decryptSensitiveData(
        encryptionData.data,
        encryptionData.iv,
        encryptionData.salt,
        encryptionData.tag,
        encryptionKey
      )
      decrypted[field] = JSON.parse(decryptedValue)
      delete decrypted[encryptedField] // Remove encrypted version
    }
  }

  return decrypted
}
