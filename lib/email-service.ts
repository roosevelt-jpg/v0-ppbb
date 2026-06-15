/**
 * Email service for sending access codes and admin notifications
 * This uses a backend API route to send emails via SendGrid or similar service
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
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111111;">Passive Blessings Admin Access Code</h2>
            
            <p>You have been invited to join the Passive Blessings admin team.</p>
            
            <div style="background-color: #f7f6f2; border: 2px solid #111111; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 10px 0;">Your admin access code is:</p>
              <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px; color: #111111;">${code}</h1>
            </div>
            
            <p><strong>How to use:</strong></p>
            <ol>
              <li>Go to <a href="https://test.myflynai.com/admin/setup">Admin Setup Page</a></li>
              <li>Enter this access code on Step 1</li>
              <li>Follow the 3-step setup process</li>
              <li>Sign in with your credentials on Step 3</li>
            </ol>
            
            <p style="color: #666;">
              <strong>Important:</strong> This access code expires in 24 hours at ${expiresAt.toLocaleString()}<br>
              For security reasons, do not share this code with anyone else.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999;">
              If you did not request this access code, please contact the super admin immediately.
            </p>
          </div>
        </body>
      </html>
    `

    const response = await fetch('/api/email/send-access-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        code,
        expiresAt
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    console.log('[v0] Access code email sent to:', email)
  } catch (error) {
    console.error('[v0] Error sending access code email:', error)
    // Don't throw - let the access code be created even if email fails
    // The admin can still access with the code
  }
}

/**
 * Send admin welcome email
 */
export const sendAdminWelcomeEmail = async (email: string, adminName: string, role: string): Promise<void> => {
  try {
    const response = await fetch('/api/email/send-welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        adminName,
        role
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    console.log('[v0] Welcome email sent to:', email)
  } catch (error) {
    console.error('[v0] Error sending welcome email:', error)
  }
}

/**
 * Send access revoked notification email
 */
export const sendAccessRevokedEmail = async (email: string, adminName: string): Promise<void> => {
  try {
    const response = await fetch('/api/email/send-access-revoked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        adminName
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    console.log('[v0] Access revoked email sent to:', email)
  } catch (error) {
    console.error('[v0] Error sending access revoked email:', error)
  }
}
