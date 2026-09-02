import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import * as crypto from 'crypto'

// Get credentials from environment
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

if (!projectId || !privateKey || !clientEmail) {
  console.error('Missing Firebase admin credentials')
  process.exit(1)
}

const firebaseAdminConfig = {
  projectId,
  privateKey,
  clientEmail,
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(firebaseAdminConfig),
})

const db = getFirestore(app)
const auth = getAuth(app)

function generateAccessCode() {
  return `PB-ADMIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

async function setupTestAdmin() {
  try {
    const email = 'admin@passiveblessings.com'
    const password = 'Admin@PassiveBlessing2025'
    const accessCode = generateAccessCode()

    console.log('\n=== Setting Up Test Admin Account ===\n')

    // Check if user exists, if not create
    let user
    try {
      user = await auth.getUserByEmail(email)
      console.log('✅ Admin user already exists in Firebase Auth')
    } catch (err) {
      console.log('Creating new Firebase Auth user...')
      user = await auth.createUser({
        email,
        password,
        displayName: 'Admin Dashboard',
      })
      console.log('✅ Firebase Auth user created')
    }

    // Create or update Firestore document with UID as doc ID
    const userRef = db.collection('users').doc(user.uid)
    await userRef.set(
      {
        id: user.uid,
        email,
        firstName: 'Admin',
        lastName: 'Dashboard',
        role: 'admin',
        accessCode,
        membershipTier: 'premium',
        volunteeredHours: 0,
        totalDonated: 0,
        memberSince: new Date().toISOString(),
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    console.log('✅ Firestore document updated\n')

    console.log('═'.repeat(60))
    console.log('TEST ADMIN CREDENTIALS')
    console.log('═'.repeat(60))
    console.log(`Email:       ${email}`)
    console.log(`Password:    ${password}`)
    console.log(`Access Code: ${accessCode}`)
    console.log('═'.repeat(60))

    console.log('\n=== HOW TO LOGIN ===')
    console.log('1. Go to: https://www.passive-blessings.com/admin/setup')
    console.log(`2. Enter Access Code: ${accessCode}`)
    console.log('3. Click Continue')
    console.log('4. Click Next (Step 2 - Verification confirmed)')
    console.log(`5. Enter Email: ${email}`)
    console.log(`6. Enter Password: ${password}`)
    console.log('7. Click Sign In')
    console.log('8. Access the admin dashboard!\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

setupTestAdmin()
