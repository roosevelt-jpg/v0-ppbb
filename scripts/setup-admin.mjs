import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

async function setupAdminUser() {
  try {
    const email = 'admin@passiveblessings.com'
    const password = 'Admin@PassiveBlessing2025'
    const accessCode = 'ADMIN2025'

    console.log('\n=== Setting up Admin User ===\n')
    console.log('Updating Firestore document for admin user...')

    await db.collection('users').doc(email).set(
      {
        accessCode,
        accessCodeUpdatedAt: new Date(),
      },
      { merge: true }
    )

    console.log('\n✅ SUCCESS! Admin user configured.\n')
    console.log('Admin Login Credentials:')
    console.log('─'.repeat(50))
    console.log(`Email:       ${email}`)
    console.log(`Password:    ${password}`)
    console.log(`Access Code: ${accessCode}`)
    console.log('─'.repeat(50))
    console.log('\nLogin URL: https://v0-ppbb.vercel.app/login')
    console.log('Steps:')
    console.log('1. Click "Admin Portal"')
    console.log('2. Enter Access Code: ADMIN2025')
    console.log('3. Enter Email: admin@passiveblessings.com')
    console.log('4. Enter Password: Admin@PassiveBlessing2025')
    console.log('5. You will be redirected to the admin dashboard\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

setupAdminUser()
