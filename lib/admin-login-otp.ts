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
export const ADMIN_OTP_TTL_MS = 10 * 60 * 1000
export const ADMIN_OTP_MAX_ATTEMPTS = 5

export function hashAdminOtp(code: string): string {
  return createHash('sha256').update(String(code).trim()).digest('hex')
}

export function generateAdminOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

async function markAdminMfaVerified(uid: string): Promise<void> {
  const db = getAdminDb()
  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        adminMfaVerifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
}

export async function createAndSendAdminLoginOtp(opts: {
  uid: string
  email: string
  adminName?: string
}): Promise<{
  ok: boolean
  error?: string
  expiresAt?: string
  /** True when Gmail SMTP is not configured — email OTP is skipped so admins can still sign in. */
  emailSkipped?: boolean
}> {
  const email = String(opts.email || '')
    .trim()
    .toLowerCase()
  const uid = String(opts.uid || '').trim()
  if (!uid || !email.includes('@')) {
    return { ok: false, error: 'Invalid admin account' }
  }

  // If SMTP is not set up yet (new Firebase / AWS), skip email OTP so super-admins are not locked out.
  const smtp = await getGmailSmtpConfig()
  if (!smtp) {
    await markAdminMfaVerified(uid)
    console.warn(
      '[admin-login-otp] Gmail SMTP not configured — skipping email OTP for',
      email
    )
    return {
      ok: true,
      emailSkipped: true,
      expiresAt: new Date(Date.now() + ADMIN_MFA_SESSION_HOURS * 60 * 60 * 1000).toISOString(),
    }
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
      paragraphs(
        greeting,
        'Use this 6-digit code to finish signing in to the Passive Blessings admin panel.'
      ),
      `<p style="margin:16px 0;font-size:28px;letter-spacing:6px;font-weight:700;color:#111;text-align:center;">${code}</p>`,
      paragraphs(
        'This code expires in 10 minutes. If you did not try to sign in, reset your password and contact a super admin.'
      ),
    ].join(''),
  })

  if (!result.ok) {
    // SMTP configured but send failed — still avoid total lockout; skip OTP this time.
    await markAdminMfaVerified(uid)
    console.warn(
      '[admin-login-otp] Email send failed — skipping OTP for',
      email,
      result.error
    )
    return {
      ok: true,
      emailSkipped: true,
      error: result.error,
      expiresAt: new Date(Date.now() + ADMIN_MFA_SESSION_HOURS * 60 * 60 * 1000).toISOString(),
    }
  }

  return { ok: true, expiresAt: expiresAt.toISOString() }
}

export async function verifyAdminLoginOtp(opts: {
  uid: string
  code: string
}): Promise<{ ok: boolean; error?: string }> {
  const uid = String(opts.uid || '').trim()
  const code = String(opts.code || '').trim()
  if (!uid || !/^\d{6}$/.test(code)) {
    return { ok: false, error: 'Enter the 6-digit code from your email.' }
  }

  const db = getAdminDb()
  const ref = db.collection(ADMIN_LOGIN_OTP_COLLECTION).doc(uid)
  const snap = await ref.get()
  if (!snap.exists) {
    return { ok: false, error: 'No login code found. Sign in again to receive a new code.' }
  }

  const data = snap.data() || {}
  const attempts = Number(data.attempts) || 0
  if (attempts >= ADMIN_OTP_MAX_ATTEMPTS) {
    await ref.delete().catch(() => undefined)
    return { ok: false, error: 'Too many attempts. Sign in again to get a new code.' }
  }

  const expiresAt =
    typeof data.expiresAt?.toDate === 'function'
      ? data.expiresAt.toDate()
      : data.expiresAt
        ? new Date(data.expiresAt)
        : null
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    await ref.delete().catch(() => undefined)
    return { ok: false, error: 'This code has expired. Sign in again to get a new code.' }
  }

  const expected = String(data.codeHash || '')
  const incoming = hashAdminOtp(code)
  if (!expected || expected !== incoming) {
    await ref.set(
      { attempts: attempts + 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    )
    return { ok: false, error: 'Incorrect code. Check your email and try again.' }
  }

  await ref.delete().catch(() => undefined)
  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        adminMfaVerifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

  return { ok: true }
}
