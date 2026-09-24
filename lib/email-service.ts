/**
 * Email service for sending access codes and admin notifications.
 * Client-side helpers call API routes that send via Zoho Mail SMTP.
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send access code to admin via email
 */
export const sendAccessCodeEmail = async (email: string, code: string, expiresAt: Date): Promise<void> => {
  try {
    const response = await fetch('/api/admin/send-access-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminEmail: email,
        adminName: email.split('@')[0] || 'Admin',
        accessCode: code,
        expiresAt: expiresAt.toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    console.log('[v0] Access code email sent to:', email)
  } catch (error) {
    console.error('[v0] Error sending access code email:', error)
    // Don't throw - let the access code be created even if email fails
  }
}

/**
 * Send admin welcome email
 */
export const sendAdminWelcomeEmail = async (email: string, adminName: string, role: string): Promise<void> => {
  try {
    const response = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        adminName,
        role,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    console.log('[v0] Welcome email sent to:', email)
  } catch (error) {
    console.error('[v0] Error sending welcome email:', error)
  }
}
