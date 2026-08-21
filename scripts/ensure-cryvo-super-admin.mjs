/**
 * Create or reset cryvo25@gmail.com as super_admin on the NEW Firebase project.
 * Uses dest service-account JSON (avoids .env private-key parse issues).
 */
import { readFileSync } from 'fs'
import { initializeApp, cert, deleteApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const DEST_SA =
  process.argv[2] ||
  'C:\\Users\\pc\\Downloads\\passiveblessings-cc0ef-firebase-adminsdk-fbsvc-66eb7e9c52.json'
const EMAIL = (process.argv[3] || 'cryvo25@gmail.com').trim().toLowerCase()
const PASSWORD = process.argv[4] || '12345678'

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

const sa = JSON.parse(readFileSync(DEST_SA, 'utf8'))

for (const app of getApps()) {
  await deleteApp(app)
}

const app = initializeApp({
  credential: cert(sa),
  projectId: sa.project_id,
})

const auth = getAuth(app)
const db = getFirestore(app)

let userRecord
try {
  userRecord = await auth.getUserByEmail(EMAIL)
  await auth.updateUser(userRecord.uid, {
    password: PASSWORD,
    emailVerified: true,
    disabled: false,
    displayName: userRecord.displayName || 'Cryvo Super Admin',
  })
  console.log(`Updated Auth user ${EMAIL} (${userRecord.uid})`)
} catch (err) {
  if (err?.code !== 'auth/user-not-found') throw err
  userRecord = await auth.createUser({
    email: EMAIL,
    password: PASSWORD,
    emailVerified: true,
    displayName: 'Cryvo Super Admin',
  })
  console.log(`Created Auth user ${EMAIL} (${userRecord.uid})`)
}

const uid = userRecord.uid
const now = FieldValue.serverTimestamp()
const adminPayload = {
  id: uid,
  uid,
  email: EMAIL,
  name: 'Cryvo Super Admin',
  displayName: 'Cryvo Super Admin',
  firstName: 'Cryvo',
  lastName: 'Admin',
  role: 'super_admin',
  adminRole: 'super_admin',
  roles: ['super_admin'],
  isSuperAdmin: true,
  permissions: SUPER_PERMISSIONS,
  status: 'active',
  active: true,
  updatedAt: now,
}

await db.collection('users').doc(uid).set({ ...adminPayload, createdAt: now }, { merge: true })
await db.collection('adminUsers').doc(uid).set({ ...adminPayload, createdAt: now }, { merge: true })
await db.collection('admin-users').doc(uid).set({ ...adminPayload, createdAt: now }, { merge: true })

console.log('Promoted to super_admin in users / adminUsers / admin-users')
console.log('')
console.log('Login at /admin/login with:')
console.log(`  Email:    ${EMAIL}`)
console.log(`  Password: ${PASSWORD}`)
console.log('No invitation email / Gmail SMTP required for this account.')

await deleteApp(app)
