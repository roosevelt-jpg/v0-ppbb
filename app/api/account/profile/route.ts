import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { splitFullName } from '@/lib/user-profile'

type ProfileBody = {
  fullName?: string
  email?: string
  phone?: string
  profilePictureURL?: string
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * PATCH /api/account/profile
 * Updates the signed-in user's profile in Firestore (Admin SDK).
 * Syncs admin-users / adminUsers when those docs exist.
 *
 * Intentionally does NOT import firebase-admin/auth — that module crashes some
 * Vercel/Next serverless bundles at load time (HTML 500 before the handler runs).
 * Firebase Auth profile fields are updated on the client after a successful save.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authorization required' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    const body = (await request.json()) as ProfileBody
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const picture =
      typeof body.profilePictureURL === 'string' ? body.profilePictureURL.trim() : ''

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 })
    }

    const { firstName, lastName } = splitFullName(fullName)
    if (!firstName) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const db = getAdminDb()
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    const existing = userSnap.exists ? userSnap.data() || {} : {}

    const now = Timestamp.now()
    const displayName = fullName

    const firestoreUpdates = sanitizeForFirestore({
      firstName,
      lastName,
      name: displayName,
      displayName,
      email,
      phone,
      ...(picture
        ? { profilePictureURL: picture, avatarUrl: picture }
        : {}),
      updatedAt: now,
      // Ensure admins without a users/ doc can still save profile
      ...(userSnap.exists ? {} : { createdAt: now, role: existing.role || 'admin' }),
    })

    await userRef.set(firestoreUpdates, { merge: true })

    // Keep admin mirror docs in sync so admin UI never shows stale name/email
    const adminPatch = sanitizeForFirestore({
      name: displayName,
      email,
      updatedAt: now,
    })
    const adminUsersRef = db.collection('admin-users').doc(uid)
    const adminUsersSnap = await adminUsersRef.get()
    if (adminUsersSnap.exists) {
      await adminUsersRef.set(adminPatch, { merge: true })
    }

    const adminUsersCamelRef = db.collection('adminUsers').doc(uid)
    const adminUsersCamelSnap = await adminUsersCamelRef.get()
    if (adminUsersCamelSnap.exists) {
      await adminUsersCamelRef.set(
        sanitizeForFirestore({
          name: displayName,
          displayName,
          email,
          updatedAt: now,
        }),
        { merge: true }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        firstName,
        lastName,
        name: displayName,
        displayName,
        email,
        phone,
        profilePictureURL:
          picture ||
          (typeof existing.profilePictureURL === 'string' ? existing.profilePictureURL : null),
        avatarUrl:
          picture || (typeof existing.avatarUrl === 'string' ? existing.avatarUrl : null),
      },
    })
  } catch (error) {
    console.error('[v0] Account profile update error:', error)
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to update profile'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
