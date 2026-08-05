/**
 * Promote an existing Firebase Auth user to super_admin.
 *
 * Usage:
 *   node --env-file=.env.local scripts/make-super-admin.mjs cryvo25@gmail.com
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const email = String(process.argv[2] || '')
  .trim()
  .toLowerCase()

if (!email || !email.includes('@')) {
  console.error('Usage: node --env-file=.env.local scripts/make-super-admin.mjs <email>')
  process.exit(1)
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

if (!projectId || !privateKey || !clientEmail) {
  console.error(
    'Missing Firebase admin credentials. Set FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
  )
  process.exit(1)
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      })

const auth = getAuth(app)
const db = getFirestore(app)

const SUPER_PERMISSIONS = [
  'full_access',
  'admin.create_admin',
  'admin.manage_users',
  'admin.manage_permissions',
  'admin.view_all',
  'admin.create_access_codes',
  'admin.manage_access_codes',
  'admin.manage_roles',
  'admin.delete_admin',
  'dashboard.view',
  'forms.create',
  'forms.edit',
  'forms.delete',
  'forms.view_submissions',
  'pages.create',
  'pages.edit',
  'pages.delete',
  'faqs.create',
  'faqs.edit',
  'faqs.delete',
  'users.view',
  'users.edit',
  'users.delete',
  'analytics.view',
  'settings.manage',
]

async function main() {
  const userRecord = await auth.getUserByEmail(email)
  const uid = userRecord.uid
  const displayName =
    userRecord.displayName ||
    email.split('@')[0] ||
    'Super Admin'

  console.log(`Found Auth user ${email} → uid ${uid}`)

  const now = FieldValue.serverTimestamp()
  const adminPayload = {
    id: uid,
    uid,
    email,
    name: displayName,
    displayName,
    role: 'super_admin',
    adminRole: 'super_admin',
    roles: ['super_admin'],
    isSuperAdmin: true,
    permissions: SUPER_PERMISSIONS,
    status: 'active',
    active: true,
    updatedAt: now,
  }

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const existing = userSnap.exists ? userSnap.data() || {} : {}
  const existingRoles = Array.isArray(existing.roles)
    ? existing.roles.map(String)
    : []

  await userRef.set(
    {
      ...adminPayload,
      // Keep membership role if already set; admin access is via adminRole/roles/adminUsers
      role: existing.role && !['admin', 'super_admin'].includes(String(existing.role))
        ? existing.role
        : 'super_admin',
      adminRole: 'super_admin',
      roles: Array.from(new Set([...existingRoles, 'super_admin'])),
      createdAt: existing.createdAt || now,
    },
    { merge: true }
  )

  await db.collection('adminUsers').doc(uid).set(
    {
      ...adminPayload,
      createdAt: now,
    },
    { merge: true }
  )

  await db.collection('admin-users').doc(uid).set(
    {
      ...adminPayload,
      createdAt: now,
    },
    { merge: true }
  )

  console.log(`✅ ${email} is now super_admin`)
  console.log('Collections updated: users, adminUsers, admin-users')
  console.log('Ask them to sign out and sign back in at /admin/login')
}

main().catch((err) => {
  console.error('Failed:', err?.message || err)
  process.exit(1)
})
