/**
 * Gmail SMTP Email Service
 * Sends emails via Gmail using Nodemailer
 */

import nodemailer from 'nodemailer'
import { SiteSettings } from './types'
import { getAdminDb } from '@/lib/firebase-admin'
import { mergeGlobalSettings } from '@/lib/global-settings'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

/**
 * Load Gmail SMTP credentials from Integrations vault (decrypted)
 * with optional env fallback.
 */
export async function getGmailSmtpConfig(): Promise<{
  gmailEmail: string
  gmailAppPassword: string
  fromName: string
} | null> {
  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'gmailSmtp')
    const email = integration?.credentials?.gmailEmail?.trim()
    const appPassword = integration?.credentials?.gmailAppPassword?.trim()
    if (email && appPassword) {
      console.log('[v0] Loaded decrypted Gmail SMTP from integrations vault')
      return {
        gmailEmail: email,
        gmailAppPassword: appPassword,
        fromName: integration.credentials.fromName?.trim() || 'Passive Blessings',
      }
    }
    console.warn('[v0] Gmail SMTP integration missing email or app password')
  } catch (error) {
    console.error(
      '[v0] Failed to load Gmail SMTP from integrations:',
      error instanceof Error ? error.message : String(error)
    )
  }

  const envEmail = process.env.GMAIL_USER?.trim() || process.env.GMAIL_EMAIL?.trim()
  const envPassword = process.env.GMAIL_APP_PASSWORD?.trim()
  if (envEmail && envPassword) {
    console.log('[v0] Using Gmail SMTP from environment variables')
    return {
      gmailEmail: envEmail,
      gmailAppPassword: envPassword,
      fromName: process.env.GMAIL_FROM_NAME?.trim() || 'Passive Blessings',
    }
  }

  return null
}

/**
 * Create Nodemailer transporter with Gmail credentials
 */
export const createGmailTransporter = (emailConfig?: SiteSettings['emailConfig']) => {
  if (!emailConfig?.enabled || !emailConfig.gmailEmail || !emailConfig.gmailAppPassword) {
    console.warn('[v0] Gmail email config not properly configured:', {
      enabled: emailConfig?.enabled,
      hasEmail: !!emailConfig?.gmailEmail,
      hasPassword: !!emailConfig?.gmailAppPassword,
    })
    return null
  }

  try {
    console.log('[v0] Creating Gmail transporter with:', {
      email: emailConfig.gmailEmail,
      hasAppPassword: !!emailConfig.gmailAppPassword,
    })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.gmailEmail,
        pass: emailConfig.gmailAppPassword,
      },
    })

    console.log('[v0] Gmail transporter created successfully')
    return transporter
  } catch (error) {
    console.error('[v0] Failed to create Gmail transporter:', {
      error: error instanceof Error ? error.message : String(error),
      email: emailConfig.gmailEmail,
    })
    return null
  }
}

/**
 * Send admin invitation email with comprehensive details
 */
export interface AdminInviteDetails {
  adminName: string
  adminEmail: string
  role: string
  permissions: string[]
  accessCode: string
  expiresAt: Date
  setupUrl: string
  fromName?: string
  invitedBy?: {
    name: string
    roleLabel: string
    profilePictureURL?: string | null
    initials: string
  }
}

function formatInviteRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    founder_admin: 'Founder Admin',
    manager: 'Manager',
    welfare: 'Welfare',
    founder: 'Founder',
    coordinator: 'Coordinator',
    moderator: 'Moderator',
  }
  return labels[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildInviterSignatureHtml(invitedBy: NonNullable<AdminInviteDetails['invitedBy']>): string {
  const avatarCell = invitedBy.profilePictureURL
    ? `<img src="${invitedBy.profilePictureURL}" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:50%;object-fit:cover;border:1px solid #e0dfd9;" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background-color:#111111;color:#ffffff;text-align:center;line-height:48px;font-size:16px;font-weight:bold;font-family:Arial,sans-serif;">${invitedBy.initials}</div>`

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;border-top:1px solid #e0dfd9;padding-top:20px;">
      <tr>
        <td width="60" valign="top" style="padding-right:12px;">
          ${avatarCell}
        </td>
        <td valign="top" style="font-family:Arial,'Segoe UI',sans-serif;">
          <p style="margin:0 0 4px 0;font-size:15px;font-weight:bold;color:#111111;">
            ${invitedBy.name}
          </p>
          <p style="margin:0 0 6px 0;font-size:13px;color:#444444;font-weight:600;">
            ${invitedBy.roleLabel} · Passive Blessings
          </p>
          <p style="margin:0;font-size:13px;color:#666666;line-height:1.5;">
            Welcome to the team. Please complete your admin setup with the access code above.
            If you have questions about this invitation, reply to this email or contact your inviter directly.
          </p>
        </td>
      </tr>
    </table>
  `
}

/** Dark logo for light email backgrounds — reads platformConfig/globalSettings.logoUrlDark */
export async function getEmailBrandLogoUrl(): Promise<string> {
  const site = getPublicSiteUrl()
  try {
    const db = getAdminDb()
    const snap = await db.collection('platformConfig').doc('globalSettings').get()
    const settings = mergeGlobalSettings(snap.data() as Record<string, unknown> | undefined)
    if (settings.logoUrlDark) {
      const logo = settings.logoUrlDark.trim()
      if (/^https?:\/\//i.test(logo)) return logo
      return `${site}${logo.startsWith('/') ? '' : '/'}${logo}`
    }
  } catch (error) {
    console.warn(
      '[v0] Failed to load email logo from Firestore:',
      error instanceof Error ? error.message : String(error)
    )
  }
  return `${site}/images/pb-logo-black.png`
}

export const sendAdminInviteEmail = async (
  transporter: ReturnType<typeof createGmailTransporter>,
  gmailEmail: string,
  details: AdminInviteDetails
) => {
  if (!transporter) {
    throw new Error('Gmail transporter not available')
  }

  const logoUrl = await getEmailBrandLogoUrl()
  const roleLabel = formatInviteRoleLabel(details.role)
  const permissionsText = details.permissions.length > 0
    ? details.permissions.map(p => `• ${p}`).join('<br>')
    : '• Full system access'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 14px; }
          .card { background: #f7f6f2; border: 1px solid #e0dfd9; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .role-badge { display: inline-block; background: #000; color: #fff; padding: 6px 12px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
          .access-code { background: #fff; border: 2px solid #000; padding: 20px; margin: 15px 0; border-radius: 6px; text-align: center; }
          .code-label { font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .code-value { font-size: 36px; font-family: 'Courier New', monospace; letter-spacing: 4px; color: #111111; font-weight: bold; }
          .permissions { background: #fff; border-left: 4px solid #000; padding: 15px; margin: 15px 0; }
          .permissions h4 { margin: 0 0 10px 0; color: #000; }
          .permissions-list { font-size: 14px; color: #555; line-height: 1.8; }
          .step { margin: 20px 0; }
          .step-number { display: inline-block; background: #000; color: #fff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; margin-right: 10px; }
          .button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 15px 0; }
          .button:hover { background: #333; }
          .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e0dfd9; padding-top: 15px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin: 15px 0; color: #856404; font-size: 13px; }
          .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .info-label { font-weight: bold; color: #333; }
          .info-value { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <img src="${logoUrl}" alt="Passive Blessings" width="180" style="display:block;max-width:180px;height:auto;margin:0 auto 10px auto;border:0;">
            <div class="subtitle">Admin Portal</div>
          </div>

          <!-- Welcome -->
          <div class="card">
            <p>Hi <strong>${details.adminName}</strong>,</p>
            <p>You have been invited to join the Passive Blessings admin team with the following role and permissions.</p>
          </div>

          <!-- Role & Permissions -->
          <div class="card">
            <p><strong>Your Role:</strong></p>
            <div class="role-badge" style="display:inline-block;background-color:#111111;color:#ffffff;padding:6px 12px;border-radius:4px;font-weight:bold;margin:10px 0;">${roleLabel}</div>
            
            <div class="permissions">
              <h4>Permissions:</h4>
              <div class="permissions-list">
                ${permissionsText}
              </div>
            </div>
          </div>

          <!-- Access Code -->
          <div class="card">
            <p><strong>Your Access Code:</strong></p>
            <div class="access-code" style="background-color:#ffffff;border:2px solid #111111;padding:20px;margin:15px 0;border-radius:6px;text-align:center;">
              <div class="code-label" style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Use this code to complete setup</div>
              <div class="code-value" style="font-size:36px;font-family:'Courier New',monospace;letter-spacing:4px;color:#111111;font-weight:bold;">${details.accessCode}</div>
            </div>
          </div>

          <!-- Setup Instructions -->
          <div class="card">
            <p><strong>How to Setup Your Account:</strong></p>
            
            <div class="step">
              <span class="step-number" style="display:inline-block;background-color:#111111;color:#ffffff;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-weight:bold;margin-right:10px;">1</span>
              <strong>Visit the Setup Page</strong><br>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:15px 0;">
                <tr>
                  <td align="left" bgcolor="#111111" style="border-radius:6px;background-color:#111111;">
                    <a href="${details.setupUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:Arial,'Segoe UI',sans-serif;font-size:16px;font-weight:bold;color:#ffffff !important;text-decoration:none;border-radius:6px;background-color:#111111;mso-padding-alt:12px 24px;">
                      <span style="color:#ffffff !important;">Go to Setup</span>
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <div class="step">
              <span class="step-number" style="display:inline-block;background-color:#111111;color:#ffffff;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-weight:bold;margin-right:10px;">2</span>
              <strong>Enter Your Access Code</strong><br>
              Paste the access code shown above on Step 1 of the setup form.
            </div>

            <div class="step">
              <span class="step-number" style="display:inline-block;background-color:#111111;color:#ffffff;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-weight:bold;margin-right:10px;">3</span>
              <strong>Complete Your Profile</strong><br>
              Enter your name and create a secure password for your account.
            </div>

            <div class="step">
              <span class="step-number" style="display:inline-block;background-color:#111111;color:#ffffff;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-weight:bold;margin-right:10px;">4</span>
              <strong>Access the Admin Dashboard</strong><br>
              Once setup is complete, you'll be able to access the full admin portal.
            </div>
          </div>

          ${details.invitedBy ? buildInviterSignatureHtml(details.invitedBy) : ''}

          <!-- Important Info -->
          <div class="warning">
            <strong>⏰ Important:</strong> This access code expires in 24 hours at ${details.expiresAt.toLocaleString()}. If you don't complete setup in time, ask the super admin to generate a new code.
          </div>

          <div class="card">
            <div class="info-row">
              <span class="info-label">Admin Email:</span>
              <span class="info-value">${details.adminEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Role:</span>
              <span class="info-value">${roleLabel}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Code Expires:</span>
              <span class="info-value">${details.expiresAt.toLocaleString()}</span>
            </div>
          </div>

          <!-- Security Notice -->
          <div style="background: #e8f4f8; border-left: 4px solid #0084b4; padding: 12px; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #0084b4;">
              <strong>🔒 Security:</strong> Never share this access code with anyone. If you didn't request this invitation, please contact the super admin immediately.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 10px 0;">This email was sent to ${details.adminEmail} because you were invited as an admin.</p>
            <p style="margin: 0;">© ${new Date().getFullYear()} Passive Blessings. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const mailOptions = {
      from: `"${details.fromName || 'Passive Blessings'}" <${gmailEmail}>`,
      to: details.adminEmail,
      subject: `You're Invited to Join Passive Blessings Admin Team - ${roleLabel}`,
      html,
    }

    console.log('[v0] Sending admin invite email with config:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      transporterExists: !!transporter,
    })

    const info = await transporter.sendMail(mailOptions)
    console.log('[v0] Admin invite email sent successfully:', {
      messageId: info.messageId,
      to: details.adminEmail,
      timestamp: new Date().toISOString(),
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[v0] Failed to send admin invite email:', {
      error: error instanceof Error ? error.message : String(error),
      to: details.adminEmail,
      from: gmailEmail,
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

/**
 * Full invite send: load vault credentials → transporter → branded email.
 */
export async function dispatchAdminInviteEmail(
  details: Omit<AdminInviteDetails, 'setupUrl' | 'fromName'> & {
    setupUrl?: string
    fromName?: string
  }
): Promise<{ success: true; messageId?: string }> {
  const gmailConfig = await getGmailSmtpConfig()
  if (!gmailConfig) {
    throw new Error(
      'Email service not configured. Please configure Gmail SMTP in Admin → Integrations.'
    )
  }

  const transporter = createGmailTransporter({
    enabled: true,
    gmailEmail: gmailConfig.gmailEmail,
    gmailAppPassword: gmailConfig.gmailAppPassword,
  } as SiteSettings['emailConfig'])

  if (!transporter) {
    throw new Error('Failed to initialize Gmail SMTP. Check your Gmail App Password.')
  }

  const setupUrl = details.setupUrl || `${getPublicSiteUrl()}/admin/setup`
  return sendAdminInviteEmail(transporter, gmailConfig.gmailEmail, {
    ...details,
    setupUrl,
    fromName: details.fromName || gmailConfig.fromName,
  })
}

/**
 * Certificate milestone congratulations email
 */
export interface CertificateMilestoneEmailDetails {
  to: string
  memberName: string
  subject: string
  bodyText: string
  certificateTitle: string
  hours: number
  fromName?: string
}

export async function sendCertificateMilestoneEmail(
  transporter: ReturnType<typeof createGmailTransporter>,
  gmailEmail: string,
  details: CertificateMilestoneEmailDetails
): Promise<{ success: boolean; messageId?: string }> {
  if (!transporter) {
    throw new Error('Email transporter not configured')
  }

  const paragraphs = details.bodyText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px 0;line-height:1.6;color:#333;">${p}</p>`)
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;font-family:Georgia,serif;background:#f7f6f2;">
        <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
          <div style="background:#fff;border:3px solid #111;padding:32px;border-radius:4px;">
            <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#888;">Passive Blessings</p>
            <h1 style="margin:0 0 20px 0;font-size:24px;color:#111;">${details.certificateTitle}</h1>
            ${paragraphs}
            <p style="margin:20px 0 0 0;font-size:14px;color:#666;">
              <strong>${details.hours}</strong> volunteer hours logged · View your certificate in your member dashboard.
            </p>
          </div>
          <p style="margin:16px 0 0 0;font-size:11px;color:#999;text-align:center;">© ${new Date().getFullYear()} Passive Blessings</p>
        </div>
      </body>
    </html>
  `

  const info = await transporter.sendMail({
    from: `"${details.fromName || 'Passive Blessings'}" <${gmailEmail}>`,
    to: details.to,
    subject: details.subject,
    html,
    text: details.bodyText,
  })

  return { success: true, messageId: info.messageId }
}

/**
 * Verify Gmail credentials are valid
 */
export const verifyGmailCredentials = async (
  transporter: ReturnType<typeof createGmailTransporter>
): Promise<boolean> => {
  if (!transporter) {
    return false
  }

  try {
    await transporter.verify()
    console.log('[v0] Gmail credentials verified successfully')
    return true
  } catch (error) {
    console.error('[v0] Gmail credentials verification failed:', error)
    return false
  }
}
