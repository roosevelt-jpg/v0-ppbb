/**
 * Admin login email OTP (step 3 after email + password).
 * Stored via Admin SDK — no client Firestore rules needed.
 */

import { createHash, randomInt } from 'crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { getGmailSmtpConfig } from '@/lib/gmail-service'
import { paragraphs, sendBrandedEmail } from '@/lib/platform-email'

export const ADMIN_LOGIN_OTP_COLLECTION = 'adminLoginOtps'
export const ADMIN_MFA_SESSION_HOURS = 12
export const ADMIN_OTP_TTL_MS = 24 * 60 * 60 * 1000
export const ADMIN_OTP_MAX_ATTEMPTS = 5

export function hashAdminOtp(code: string): string {
  return createHash('sha256').update(String(code).trim()).digest('hex')
}

export function generateAdminOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export async function createAndSendAdminLoginOtp(opts: {
  uid: string
  email: string
  adminName?: string
}): Promise<{
  ok: boolean
  error?: string
  expiresAt?: string
  emailSkipped?: boolean
}> {
  const email = String(opts.email || '').trim().toLowerCase()
  const uid = String(opts.uid || '').trim()
  if (!uid || !email.includes('@')) return { ok: false, error: 'Invalid admin account' }

  const smtp = await getGmailSmtpConfig()
  if (!smtp) {
    return { ok: false, error: 'Admin login code delivery is unavailable. Please contact a super admin.' }
  }

  const code = generateAdminOtpCode()
  const expiresAt = new Date(Date.now() + ADMIN_OTP_TTL_MS)
  const db = getAdminDb()

  await db.collection(ADMIN_LOGIN_OTP_COLLECTION).doc(uid).set(
    {
      uid,
      email,
      codeHash: hashAdminOtp(code),
      attempts: 0,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  const name = String(opts.adminName || '').trim()
  const greeting = name ? `Assalamu alaikum, ${name}.` : 'Assalamu alaikum,'
  const result = await sendBrandedEmail({
    to: email,
    subject: 'Your Passive Blessings admin login code',
    purpose: 'Admin login verification',
    headline: 'Admin login code',
    bodyHtml: [
      paragraphs(greeting, 'Use this 6-digit code to finish signing in to the Passive Blessings admin panel.'),
      `<p style="margin:16px 0;font-size:28px;letter-spacing:6px;font-weight:700;color:#111;text-align:center;">${code}</p>`,
      paragraphs('This code expires in 24 hours. If you did not try to sign in, reset your password and contact a super admin.'),
    ].join(''),
  })

  if (!result.ok) {
    await db.collection(ADMIN_LOGIN_OTP_COLLECTION).doc(uid).delete().catch(() => undefined)
    return { ok: false, error: 'Could not send the admin login code. Please try again or contact a super admin.' }
  }

  return { ok: true, expiresAt: expiresAt.toISOString() }
}

export async function verifyAdminLoginOtp(opts: {
  uid: string
  code: string
}): Promise<{ ok: boolean; error?: string }> {
  const uid = String(opts.uid || '').trim()
  const code = String(opts.code || '').trim()
  if (!uid || !/^\d{6}$/.test(code)) return { ok: false, error: 'Enter the 6-digit code from your email.' }

  const db = getAdminDb()
  const ref = db.collection(ADMIN_LOGIN_OTP_COLLECTION).doc(uid)

  try {
    const consumed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return { ok: false, error: 'No login code found. Sign in again to receive a new code.' }

      const data = snap.data() || {}
      const attempts = Number(data.attempts) || 0
      if (attempts >= ADMIN_OTP_MAX_ATTEMPTS) {
        tx.delete(ref)
        return { ok: false, error: 'Too many attempts. Sign in again to get a new code.' }
      }

      const expiresAt = typeof data.expiresAt?.toDate === 'function'
        ? data.expiresAt.toDate()
        : data.expiresAt ? new Date(data.expiresAt) : null
      if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        tx.delete(ref)
        return { ok: false, error: 'This code has expired. Sign in again to get a new code.' }
      }

      if (String(data.codeHash || '') !== hashAdminOtp(code)) {
        tx.set(ref, { attempts: attempts + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
        return { ok: false, error: 'Incorrect code. Check your email and try again.' }
      }

      tx.delete(ref)
      return { ok: true }
    })

    if (!consumed.ok) return consumed

    await db.collection('users').doc(uid).set(
      { adminMfaVerifiedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    )
    return { ok: true }
  } catch (error) {
    console.error('[admin-login-otp] verification transaction failed', error)
    return { ok: false, error: 'Could not verify the login code. Please try again.' }
  }
}
