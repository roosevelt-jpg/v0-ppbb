import { NextRequest, NextResponse } from 'next/server'
import { generateDynamicAccessCode } from '@/lib/admin-login-tracking'
import { getFirestore, collection, query, where, getDocs } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

// Email sending (using SendGrid if configured)
async function sendAccessCodeEmail(email: string, code: string, adminName: string) {
  try {
    const sendgridApiKey = process.env.SENDGRID_API_KEY
    if (!sendgridApiKey) {
      console.warn('[v0] SendGrid API key not configured, skipping email')
      return true
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email, name: adminName }],
            subject: 'Your Passive Blessings Admin Access Code',
          },
        ],
        from: { email: 'noreply@passiveblessings.com', name: 'Passive Blessings' },
        content: [
          {
            type: 'text/html',
            value: `
              <h2>Admin Access Code</h2>
              <p>Hello ${adminName},</p>
              <p>Your access code to log in to the admin dashboard is:</p>
              <h1 style="color: #111111; font-size: 32px; letter-spacing: 2px;">${code}</h1>
              <p><strong>This code will expire in 24 hours.</strong></p>
              <p>If you did not request this code, please ignore this email.</p>
              <p>For security, this code is unique and single-use.</p>
              <hr/>
              <p><small>Do not share this code with anyone. Our team will never ask for your access code.</small></p>
            `,
          },
        ],
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[v0] Error sending access code email:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminEmail, adminName, adminRole, permissions, createdBy } = body

    // Validate inputs
    if (!adminEmail || !adminName || !adminRole) {
      return NextResponse.json(
        { error: 'Missing required fields: adminEmail, adminName, adminRole' },
        { status: 400 }
      )
    }

    // Verify creator is super admin
    if (createdBy) {
      const creatorQuery = query(
        collection(db, 'users'),
        where('id', '==', createdBy),
        where('role', '==', 'super_admin')
      )
      const creatorSnapshot = await getDocs(creatorQuery)
      
      if (creatorSnapshot.empty) {
        return NextResponse.json(
          { error: 'Only super admins can generate access codes' },
          { status: 403 }
        )
      }
    }

    // Generate access code
    const accessCode = await generateDynamicAccessCode(
      adminEmail,
      adminName,
      adminRole || 'admin',
      permissions || [],
      createdBy || 'system'
    )

    if (!accessCode) {
      return NextResponse.json(
        { error: 'Failed to generate access code' },
        { status: 500 }
      )
    }

    // Send email
    await sendAccessCodeEmail(adminEmail, accessCode.code, adminName)

    return NextResponse.json({
      success: true,
      accessCodeId: accessCode.id,
      code: accessCode.code,
      expiresAt: accessCode.expiresAt,
      message: 'Access code generated and sent to email',
    })
  } catch (error) {
    console.error('[v0] Access code generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate access code' },
      { status: 500 }
    )
  }
}
