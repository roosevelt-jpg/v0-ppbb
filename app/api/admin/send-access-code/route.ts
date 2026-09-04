import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Email transporter (using SendGrid or Gmail)
const getEmailTransporter = () => {
  const sendgridApiKey = process.env.SENDGRID_API_KEY
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (sendgridApiKey) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: sendgridApiKey,
      },
    })
  } else if (gmailUser && gmailPassword) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    })
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, adminName, accessCode } = await request.json()

    // Validate input
    if (!adminEmail || !adminName || !accessCode) {
      return NextResponse.json(
        { error: 'Missing required fields: adminEmail, adminName, accessCode' },
        { status: 400 }
      )
    }

    // Get email transporter
    const transporter = getEmailTransporter()
    if (!transporter) {
      console.error('[v0] Email service not configured')
      return NextResponse.json(
        { error: 'Email service not available. Contact support.' },
        { status: 503 }
      )
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@passiveblessings.com',
      to: adminEmail,
      subject: 'Your Passive Blessings Admin Access Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #111111; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Passive Blessings</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #cccccc;">Admin Access</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e4e1da; border-radius: 0 0 8px 8px;">
            <p style="color: #111111; font-size: 16px; margin-bottom: 10px;">Hi ${adminName},</p>
            
            <p style="color: #555555; font-size: 14px; margin-bottom: 20px;">
              Your admin access code has been generated. Use this code to log in to the Passive Blessings admin dashboard.
            </p>
            
            <div style="background-color: #f9f8f5; border: 2px solid #111111; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: #888888; margin-bottom: 10px;">Your Access Code</p>
              <p style="margin: 0; font-family: monospace; font-size: 24px; font-weight: bold; color: #111111; letter-spacing: 2px;">
                ${accessCode}
              </p>
            </div>
            
            <p style="color: #555555; font-size: 14px; margin-bottom: 20px;">
              Steps to login:
            </p>
            
            <ol style="color: #555555; font-size: 14px; margin-bottom: 20px;">
              <li>Go to <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.passive-blessings.com'}/admin/setup" style="color: #111111;">Admin Login</a></li>
              <li>Enter the access code above</li>
              <li>Sign in with your email and password</li>
            </ol>
            
            <div style="background-color: #fef3f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #991b1b; font-size: 13px; margin: 0;">
                <strong>Security Note:</strong> Keep this code confidential. Do not share it with anyone. This code will grant access to sensitive admin functions.
              </p>
            </div>
            
            <p style="color: #555555; font-size: 14px; margin-bottom: 20px;">
              If you didn't request this code, please contact your system administrator immediately.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e4e1da; margin: 30px 0;" />
            
            <p style="color: #888888; font-size: 12px; text-align: center; margin: 0;">
              Passive Blessings Admin Dashboard | Generated at ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    console.log('[v0] Access code email sent to:', adminEmail)

    return NextResponse.json({
      success: true,
      message: `Access code sent to ${adminEmail}`,
    })
  } catch (error: any) {
    console.error('[v0] Error sending access code email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
