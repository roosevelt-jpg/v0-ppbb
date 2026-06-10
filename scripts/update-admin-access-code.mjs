import { initializeApp, getApps } from 'firebase/app'
import { cert, getApps as getAdminApps, initializeApp as initializeAdminApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Get credentials
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

if (!projectId || !privateKey || !clientEmail) {
  console.error('Missing Firebase credentials')
  process.exit(1)
}

const firebaseAdminConfig = {
  projectId,
  privateKey,
  clientEmail,
}

const app = getAdminApps().length > 0 ? getAdminApps()[0] : initializeAdminApp({
  credential: cert(firebaseAdminConfig),
})

const db = getFirestore(app)

async function updateAdminAccessCode() {
  try {
    console.log('Searching for admin user...')
    
    // Find admin user by email
    const usersRef = db.collection('users')
    const adminQuery = await usersRef.where('email', '==', 'admin@passiveblessings.com').get()
    
    if (adminQuery.empty) {
      console.error('Admin user not found')
      process.exit(1)
    }

    const adminDoc = adminQuery.docs[0]
    const adminId = adminDoc.id

    console.log(`Found admin user: ${adminId}`)
    console.log(`Current data:`, adminDoc.data())

    // Update with access code
    await usersRef.doc(adminId).update({
      accessCode: 'ADMIN2025',
      updatedAt: new Date(),
    })

    console.log('\n✓ Access code updated successfully!')
    console.log('Access Code: ADMIN2025')
    console.log('Email: admin@passiveblessings.com')
    console.log('Password: Admin@PassiveBlessing2025')
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

updateAdminAccessCode()
