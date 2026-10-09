/**
 * Zoho Mail SMTP — primary transactional email path for Passive Blessings.
 * Credentials live in Admin → Integrations → Zoho Mail SMTP.
 */

import { createHash } from 'crypto'
import nodemailer, { type Transporter } from 'nodemailer'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID, integrationDocId } from '@/lib/integrations/constants'

/** Every Zoho data center, org (smtppro) host first. An account only exists in one of them. */
export const ZOHO_SMTP_HOSTS = [
  'smtppro.zoho.com',
  'smtp.zoho.com',
  'smtppro.zoho.eu',
  'smtp.zoho.eu',
  'smtppro.zoho.in',
  'smtp.zoho.in',
  'smtppro.zoho.com.au',
  'smtp.zoho.com.au',
  'smtppro.zoho.sa',
  'smtp.zoho.sa',
  'smtppro.zoho.ae',
  'smtp.zoho.ae',
  'smtppro.zoho.jp',
  'smtp.zoho.jp',
  'smtppro.zohocloud.ca',
  'smtp.zohocloud.ca',
] as const

export type ZohoSmtpHostPreset = (typeof ZOHO_SMTP_HOSTS)[number]

export type ZohoSmtpConfig = {
  email: string
  password: string
  fromName: string
  host: ZohoSmtpHostPreset
  port: 465 | 587
  source: 'integration' | 'env'
}

function normalizeHost(raw: unknown): ZohoSmtpHostPreset {
  const h = String(raw || '')
    .trim()
    .toLowerCase()
  const match = ZOHO_SMTP_HOSTS.find((candidate) => candidate === h)
  return match || 'smtppro.zoho.com'
}

function normalizePort(raw: unknown): 465 | 587 {
  return Number(raw) === 587 ? 587 : 465
}

/** Zoho shows app passwords in groups. SMTP auth fails if those spaces are kept. */
function normalizeAppPassword(raw: string): string {
  return raw.replace(/\s+/g, '')
}

/** decryptField() hands back the stored `iv:ciphertext` when the encryption key no longer matches. */
function looksLikeUndecryptedSecret(value: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]{32,}$/i.test(value)
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
        password: normalizeAppPassword(password),
        fromName: integration?.credentials?.fromName?.trim() || 'Passive Blessings',
        host: normalizeHost(integration?.credentials?.smtpHost),
        port: normalizePort(integration?.credentials?.smtpPort),
        source: 'integration',
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
      password: normalizeAppPassword(envPassword),
      fromName: process.env.ZOHO_FROM_NAME?.trim() || 'Passive Blessings',
      host: normalizeHost(process.env.ZOHO_SMTP_HOST),
      port: normalizePort(process.env.ZOHO_SMTP_PORT),
      source: 'env',
    }
  }

  return null
}

export function createZohoTransporter(config: ZohoSmtpConfig, opts: { fast?: boolean } = {}) {
  const useTls = config.port === 587
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: !useTls, // 465 = SSL, 587 = STARTTLS
    auth: {
      user: config.email,
      pass: config.password,
    },
    // Prefer IPv4. Some hosts hang on Zoho's IPv6 address and the login request times out.
    family: 4,
    connectionTimeout: opts.fast ? 6_000 : 10_000,
    greetingTimeout: opts.fast ? 6_000 : 10_000,
    socketTimeout: opts.fast ? 10_000 : 20_000,
  })
}

type SmtpErrorLike = { code?: string; responseCode?: number; message?: string }

const CONNECTION_ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EDNS', 'ECONNREFUSED', 'ENOTFOUND'])

function isAuthError(err: unknown): boolean {
  const e = (err || {}) as SmtpErrorLike
  return e.code === 'EAUTH' || e.responseCode === 535
}

function isRecoverableWithAnotherHost(err: unknown): boolean {
  const e = (err || {}) as SmtpErrorLike
  return isAuthError(err) || CONNECTION_ERROR_CODES.has(String(e.code || ''))
}

export function explainZohoSmtpError(err: unknown, config: Pick<ZohoSmtpConfig, 'email' | 'host' | 'port'>): string {
  const e = (err || {}) as SmtpErrorLike
  const raw = err instanceof Error ? err.message : String(err)
  if (isAuthError(err)) {
    return (
      `Zoho rejected the SMTP login for ${config.email} (535 Authentication Failed) on every Zoho server tried. ` +
      'Generate a new Application-Specific Password in Zoho Accounts → Security → App Passwords, ' +
      'make sure SMTP/IMAP access is enabled for this mailbox in Zoho Mail Admin, use the mailbox primary address (not an alias), ' +
      'then save it again in Admin → Integrations → Zoho Mail SMTP.'
    )
  }
  if (CONNECTION_ERROR_CODES.has(String(e.code || ''))) {
    return `Could not reach Zoho SMTP at ${config.host}:${config.port} (${raw}).`
  }
  return raw
}

const workingTransport = new Map<string, { host: ZohoSmtpHostPreset; port: 465 | 587 }>()
const recentFailure = new Map<string, { error: string; until: number }>()
const FAILURE_COOLDOWN_MS = 2 * 60 * 1000

function credentialFingerprint(config: ZohoSmtpConfig): string {
  return createHash('sha256')
    .update(`${config.email}|${config.password}|${config.host}|${config.port}`)
    .digest('hex')
}

async function rememberWorkingHost(config: ZohoSmtpConfig): Promise<void> {
  if (config.source !== 'integration') return
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin')
    await getAdminDb()
      .collection('integrations')
      .doc(integrationDocId('zohoSmtp', INTEGRATION_OWNER_USER_ID))
      .set(
        {
          credentials: { smtpHost: config.host, smtpPort: String(config.port) },
          status: 'active',
          updatedAt: new Date(),
        },
        { merge: true }
      )
  } catch (error) {
    console.warn('[zoho-smtp] Could not save working host:', error instanceof Error ? error.message : error)
  }
}

/**
 * Return a transporter that has already logged in to Zoho. When the saved
 * host/port is rejected (wrong data center, personal vs org host, blocked
 * port) every other Zoho host is tried in parallel and the one that accepts
 * the login is remembered — in memory and back on the integration.
 */
export async function getWorkingZohoTransport(
  config: ZohoSmtpConfig
): Promise<{ transporter: Transporter; config: ZohoSmtpConfig }> {
  if (looksLikeUndecryptedSecret(config.password)) {
    throw new Error(
      'The saved Zoho app password can no longer be decrypted (the server encryption key changed after it was saved). ' +
        'Re-enter the app password in Admin → Integrations → Zoho Mail SMTP.'
    )
  }

  const fingerprint = credentialFingerprint(config)
  const known = workingTransport.get(fingerprint)
  if (known) {
    const resolved = { ...config, ...known }
    return { transporter: createZohoTransporter(resolved), config: resolved }
  }

  const failed = recentFailure.get(fingerprint)
  if (failed && failed.until > Date.now()) throw new Error(failed.error)

  const primary = createZohoTransporter(config)
  let primaryError: unknown
  try {
    await primary.verify()
    workingTransport.set(fingerprint, { host: config.host, port: config.port })
    return { transporter: primary, config }
  } catch (error) {
    primaryError = error
    if (!isRecoverableWithAnotherHost(error)) {
      throw new Error(explainZohoSmtpError(error, config))
    }
  }

  const alternates: ZohoSmtpConfig[] = [
    ...(config.port === 465 ? [{ ...config, port: 587 as const }] : [{ ...config, port: 465 as const }]),
    ...ZOHO_SMTP_HOSTS.filter((host) => host !== config.host).map((host) => ({
      ...config,
      host,
      port: 465 as const,
    })),
  ]

  const winner = await Promise.any(
    alternates.map(async (candidate) => {
      const transporter = createZohoTransporter(candidate, { fast: true })
      await transporter.verify()
      return { transporter, config: candidate }
    })
  ).catch(() => null)

  if (winner) {
    console.warn(
      `[zoho-smtp] ${config.host}:${config.port} rejected the login; using ${winner.config.host}:${winner.config.port} instead`
    )
    workingTransport.set(fingerprint, { host: winner.config.host, port: winner.config.port })
    void rememberWorkingHost(winner.config)
    return { transporter: createZohoTransporter(winner.config), config: winner.config }
  }

  const message = explainZohoSmtpError(primaryError, config)
  recentFailure.set(fingerprint, { error: message, until: Date.now() + FAILURE_COOLDOWN_MS })
  throw new Error(message)
}
