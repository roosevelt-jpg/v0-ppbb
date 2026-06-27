/**
 * Gmail SMTP Email Service
 * Sends emails via Gmail using Nodemailer
 */

import nodemailer from 'nodemailer'
import { SiteSettings } from './types'
import { getFirestore } from 'firebase-admin/firestore'
import { getApps, cert, initializeApp } from 'firebase-admin/app'

/**
 * Get admin Firestore instance for loading integrations
 */
function getAdminDb() {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  })
  return getFirestore(app)
}

/**
 * Load Gmail SMTP credentials from integrations collection
 */
export async function getGmailSmtpConfig() {
  try {
    const db = getAdminDb()
    const integrationDoc = await db.collection('integrations').doc('dev-user-001_gmailSmtp').get()
    
    if (!integrationDoc.exists) {
      console.warn('[v0] Gmail SMTP integration not found in Firestore')
      return null
    }

    const data = integrationDoc.data()
    console.log('[v0] Loaded Gmail SMTP config from integrations')
    
    return {
      gmailEmail: data?.credentials?.gmailEmail,
      gmailAppPassword: data?.credentials?.gmailAppPassword,
      fromName: data?.credentials?.fromName,
    }
  } catch (error) {
    console.error('[v0] Failed to load Gmail SMTP from integrations:', error instanceof Error ? error.message : String(error))
    return null
  }
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
        pass: emailConfig.gmailAppPassword, // Gmail App Password (not regular password)
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
  role: 'admin' | 'super_admin'
  permissions: string[]
  accessCode: string
  expiresAt: Date
  setupUrl: string
  fromName?: string
}

export const sendAdminInviteEmail = async (
  transporter: ReturnType<typeof createGmailTransporter>,
  gmailEmail: string,
  details: AdminInviteDetails
) => {
  if (!transporter) {
    throw new Error('Gmail transporter not available')
  }

  const roleLabel = details.role === 'super_admin' ? 'Super Admin' : 'Admin'
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
          .code-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .code-value { font-size: 36px; font-family: 'Courier New', monospace; letter-spacing: 4px; color: #000; font-weight: bold; }
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
            <div class="logo">Passive Blessings</div>
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
            <div class="role-badge">${roleLabel}</div>
            
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
            <div class="access-code">
              <div class="code-label">Use this code to complete setup</div>
              <div class="code-value">${details.accessCode}</div>
            </div>
          </div>

          <!-- Setup Instructions -->
          <div class="card">
            <p><strong>How to Setup Your Account:</strong></p>
            
            <div class="step">
              <span class="step-number">1</span>
              <strong>Visit the Setup Page</strong><br>
              <a href="${details.setupUrl}" class="button">Go to Setup</a>
            </div>

            <div class="step">
              <span class="step-number">2</span>
              <strong>Enter Your Access Code</strong><br>
              Paste the access code shown above on Step 1 of the setup form.
            </div>

            <div class="step">
              <span class="step-number">3</span>
              <strong>Complete Your Profile</strong><br>
              Enter your name and create a secure password for your account.
            </div>

            <div class="step">
              <span class="step-number">4</span>
              <strong>Access the Admin Dashboard</strong><br>
              Once setup is complete, you'll be able to access the full admin portal.
            </div>
          </div>

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
