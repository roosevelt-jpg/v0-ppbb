/**
 * Zoho Mail SMTP — primary transactional email path for Passive Blessings.
 * Credentials live in Admin → Integrations → Zoho Mail SMTP.
 */

import nodemailer from 'nodemailer'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export type ZohoSmtpHostPreset = 'smtppro.zoho.com' | 'smtp.zoho.com' | 'smtp.zoho.eu'

export type ZohoSmtpConfig = {
  email: string
  password: string
  fromName: string
  host: ZohoSmtpHostPreset
  port: 465 | 587
}

function normalizeHost(raw: unknown): ZohoSmtpHostPreset {
  const h = String(raw || '')
    .trim()
    .toLowerCase()
  if (h === 'smtp.zoho.com') return 'smtp.zoho.com'
  if (h === 'smtp.zoho.eu') return 'smtp.zoho.eu'
  return 'smtppro.zoho.com'
}

function normalizePort(raw: unknown): 465 | 587 {
  return Number(raw) === 587 ? 587 : 465
}

/**
 * Load Zoho SMTP credentials from Integrations vault (decrypted)
 * with optional env fallback (ZOHO_SMTP_*).
 */
export async function getZohoSmtpConfig(): Promise<ZohoSmtpConfig | null> {
  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'zohoSmtp')
    const email = integration?.credentials?.zohoEmail?.trim()
    const password = integration?.credentials?.zohoAppPassword?.trim()
    if (email && password) {
      return {
        email,
        password,
        fromName: integration?.credentials?.fromName?.trim() || 'Passive Blessings',
        host: normalizeHost(integration?.credentials?.smtpHost),
        port: normalizePort(integration?.credentials?.smtpPort),
      }
    }
  } catch (error) {
    console.error(
      '[zoho-smtp] Failed to load from integrations:',
      error instanceof Error ? error.message : String(error)
    )
  }

  const envEmail = process.env.ZOHO_SMTP_USER?.trim() || process.env.ZOHO_EMAIL?.trim()
  const envPassword = process.env.ZOHO_SMTP_PASSWORD?.trim() || process.env.ZOHO_APP_PASSWORD?.trim()
  if (envEmail && envPassword) {
    return {
      email: envEmail,
      password: envPassword,
      fromName: process.env.ZOHO_FROM_NAME?.trim() || 'Passive Blessings',
      host: normalizeHost(process.env.ZOHO_SMTP_HOST),
      port: normalizePort(process.env.ZOHO_SMTP_PORT),
    }
  }

  return null
}

export function createZohoTransporter(config: ZohoSmtpConfig) {
  const useTls = config.port === 587
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: !useTls, // 465 = SSL, 587 = STARTTLS
    auth: {
      user: config.email,
      pass: config.password,
    },
  })
}
