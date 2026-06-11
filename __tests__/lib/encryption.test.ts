import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { 
  encryptApiKey, 
  decryptApiKey, 
  maskApiKey, 
  validateApiKeyFormat,
  generateAuditHash 
} from '@/lib/encryption'

describe('Encryption Utilities', () => {
  describe('encryptApiKey and decryptApiKey', () => {
    it('should encrypt and decrypt API keys correctly', () => {
      const testKey = 'sk_test_1234567890abcdef'
      const encrypted = encryptApiKey(testKey)

      expect(encrypted).toHaveProperty('encrypted')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('authTag')

      const decrypted = decryptApiKey(encrypted)
      expect(decrypted).toBe(testKey)
    })

    it('should produce different encrypted output for same input', () => {
      const testKey = 'sk_test_1234567890abcdef'
      const encrypted1 = encryptApiKey(testKey)
      const encrypted2 = encryptApiKey(testKey)

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted)
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
    })

    it('should throw error on invalid encrypted data', () => {
      expect(() => {
        decryptApiKey({
          encrypted: 'invalid',
          iv: 'invalid',
          authTag: 'invalid',
        })
      }).toThrow()
    })
  })

  describe('maskApiKey', () => {
    it('should mask API key showing first and last 4 characters', () => {
      const masked = maskApiKey('sk_test_1234567890abcdef_production')
      expect(masked).toBe('sk_t****_prod')
    })

    it('should return REDACTED for short keys', () => {
      const masked = maskApiKey('short')
      expect(masked).toBe('***REDACTED***')
    })

    it('should handle already redacted keys', () => {
      const masked = maskApiKey('***REDACTED***')
      expect(masked).toBe('***REDACTED***')
    })
  })

  describe('validateApiKeyFormat', () => {
    it('should validate Stripe keys', () => {
      expect(validateApiKeyFormat('stripe', 'sk_live_123456789012345678901234')).toBe(true)
      expect(validateApiKeyFormat('stripe', 'invalid_key')).toBe(false)
    })

    it('should validate SendGrid keys', () => {
      expect(validateApiKeyFormat('sendgrid', 'SG.1234567890123456789012345678901234567890')).toBe(true)
      expect(validateApiKeyFormat('sendgrid', 'invalid_key')).toBe(false)
    })

    it('should validate Anthropic keys', () => {
      expect(validateApiKeyFormat('anthropic', 'sk-123456789012345678901234567890')).toBe(true)
      expect(validateApiKeyFormat('anthropic', 'invalid_key')).toBe(false)
    })

    it('should use generic validation for unknown services', () => {
      expect(validateApiKeyFormat('unknown', '12345678')).toBe(true)
      expect(validateApiKeyFormat('unknown', '1234567')).toBe(false)
    })
  })

  describe('generateAuditHash', () => {
    it('should generate consistent hash for same input', () => {
      const hash1 = generateAuditHash('test_key')
      const hash2 = generateAuditHash('test_key')

      expect(hash1).toBe(hash2)
      expect(hash1.length).toBe(16)
    })

    it('should generate different hash for different input', () => {
      const hash1 = generateAuditHash('test_key_1')
      const hash2 = generateAuditHash('test_key_2')

      expect(hash1).not.toBe(hash2)
    })
  })
})

describe('API Configuration Utilities', () => {
  describe('validateApiKeyFormat for all services', () => {
    const testCases = [
      ['stripe', 'sk_live_51234567890123456789', true],
      ['stripe', 'pk_live_51234567890123456789', false],
      ['sendgrid', 'SG.1234567890123456789012345678901234567890', true],
      ['anthropic', 'sk-1234567890123456789012345678901234567890', true],
      ['openai', 'sk-1234567890123456789012345678901234567890', true],
      ['paypal', 'AQaB12345678901234567890', true],
      ['twilio', 'ACabcdef123456789012345678901234', true],
      ['generic', 'any_long_enough_key', true],
      ['generic', 'short', false],
    ]

    testCases.forEach(([service, key, expected]) => {
      it(`should ${expected ? 'accept' : 'reject'} ${service} key: ${key.substring(0, 10)}...`, () => {
        expect(validateApiKeyFormat(service as string, key as string)).toBe(expected)
      })
    })
  })
})

describe('Security Best Practices', () => {
  it('should not log decrypted keys', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    const testKey = 'sk_test_sensitive_data'
    const encrypted = encryptApiKey(testKey)

    const consoleOutput = consoleSpy.mock.calls.map((call) => call[0]).join(' ')
    expect(consoleOutput).not.toContain(testKey)

    consoleSpy.mockRestore()
  })

  it('should properly mask keys in error messages', () => {
    const testKey = 'sk_live_1234567890abcdef1234567890abcd'
    const masked = maskApiKey(testKey)

    expect(masked).not.toContain('1234567890abcdef')
    expect(masked).toMatch(/sk_l\*+cdef/)
  })
})
