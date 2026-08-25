import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { generateDynamicAccessCode } from '@/lib/admin-login-tracking'
import { getFirestore, collection, query, where, getDocs } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase-admin'

const db = getFirestore(getAdminApp())

async function sendAccessCodeEmail(email: string, code: string, adminName: string) {
  try {
    const sendgridApiKey = process.env.SENDGRID_API_KEY
    if (!sendgridApiKey) {
      console.warn('[v0] SendGrid API key not configured, skipping email')
      return false
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email, name: adminName }], subject: 'Your Passive Blessings Admin Access Code' }],
        from: { email: 'noreply@passiveblessings.com', name: 'Passive Blessings' },
        content: [{
          type: 'text/html',
          value: `<h2>Admin Access Code</h2><p>Hello ${adminName},</p><p>Your access code to log in to the admin dashboard is:</p><h1 style="color: #111111; font-size: 32px; letter-spacing: 2px;">${code}</h1><p><strong>This code will expire in 24 hours.</strong></p><p>If you did not request this code, please ignore this email.</p><p>For security, this code is unique and single-use.</p><hr/><p><small>Do not share this code with anyone. Our team will never ask for your access code.</small></p>`,
        }],
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
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const uid = await verifyIdToken(token)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!(await isAdminUser(uid))) {
      return NextResponse.json({ error: 'Not an admin account' }, { status: 403 })
    }

    const creatorQuery = query(
      collection(db, 'users'),
      where('id', '==', uid),
      where('role', '==', 'super_admin')
    )
    const creatorSnapshot = await getDocs(creatorQuery)
    if (creatorSnapshot.empty) {
      return NextResponse.json({ error: 'Only super admins can generate access codes' }, { status: 403 })
    }

    const body = await request.json()
    const { adminEmail, adminName, adminRole, permissions } = body

    if (!adminEmail || !adminName || !adminRole) {
      return NextResponse.json({ error: 'Missing required fields: adminEmail, adminName, adminRole' }, { status: 400 })
    }

    const accessCode = await generateDynamicAccessCode(
      String(adminEmail).trim().toLowerCase(),
      String(adminName).trim(),
      String(adminRole),
      Array.isArray(permissions) ? permissions : [],
      uid
    )

    if (!accessCode) {
      return NextResponse.json({ error: 'Failed to generate access code' }, { status: 500 })
    }

    const emailSent = await sendAccessCodeEmail(adminEmail, accessCode.code, adminName)
    if (!emailSent) {
      return NextResponse.json({ error: 'Access code was generated but could not be emailed. The code was not delivered.' }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      accessCodeId: accessCode.id,
      expiresAt: accessCode.expiresAt,
      message: 'Access code generated and sent to email',
    })
  } catch (error) {
    console.error('[v0] Access code generation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to generate access code' }, { status: 500 })
  }
}
