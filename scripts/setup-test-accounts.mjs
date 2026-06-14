import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

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

const testAccounts = [
  {
    email: 'member@example.com',
    password: 'Member@123456',
    firstName: 'John',
    lastName: 'Member',
    role: 'member',
    description: 'Regular member account'
  },
  {
    email: 'sponsor@example.com',
    password: 'Sponsor@123456',
    firstName: 'Jane',
    lastName: 'Sponsor',
    role: 'sponsor',
    description: 'Sponsor account'
  },
  {
    email: 'volunteer@example.com',
    password: 'Volunteer@123456',
    firstName: 'Bob',
    lastName: 'Volunteer',
    role: 'volunteer',
    description: 'Volunteer account'
  },
  {
    email: 'business@example.com',
    password: 'Business@123456',
    firstName: 'Alice',
    lastName: 'Business',
    role: 'business',
    description: 'Business partner account'
  }
]

async function setupTestAccounts() {
  try {
    console.log('\n=== Setting Up Test Accounts ===\n')

    const createdAccounts = []

    for (const account of testAccounts) {
      try {
        console.log(`Creating ${account.role} account: ${account.email}`)

        // Check if user exists
        let user
        try {
          user = await auth.getUserByEmail(account.email)
          console.log(`  ✅ Auth user already exists`)
        } catch (err) {
          user = await auth.createUser({
            email: account.email,
            password: account.password,
            displayName: `${account.firstName} ${account.lastName}`,
          })
          console.log(`  ✅ Firebase Auth user created`)
        }

        // Create or update Firestore document
        const userRef = db.collection('users').doc(user.uid)
        await userRef.set(
          {
            id: user.uid,
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            role: account.role,
            membershipTier: 'standard',
            volunteeredHours: 0,
            totalDonated: 0,
            memberSince: new Date().toISOString(),
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )

        console.log(`  ✅ Firestore profile created\n`)

        createdAccounts.push({
          email: account.email,
          password: account.password,
          role: account.role,
          firstName: account.firstName,
          lastName: account.lastName,
          description: account.description
        })
      } catch (error) {
        console.error(`  ❌ Error creating ${account.role} account:`, error.message, '\n')
      }
    }

    console.log('\n' + '═'.repeat(70))
    console.log('TEST ACCOUNT CREDENTIALS')
    console.log('═'.repeat(70) + '\n')

    createdAccounts.forEach((acc, idx) => {
      console.log(`${idx + 1}. ${acc.description.toUpperCase()}`)
      console.log(`   Email:    ${acc.email}`)
      console.log(`   Password: ${acc.password}`)
      console.log(`   Role:     ${acc.role}\n`)
    })

    console.log('═'.repeat(70))
    console.log('HOW TO LOGIN')
    console.log('═'.repeat(70))
    console.log('1. Go to: https://test.myflynai.com/login')
    console.log('2. Or: https://test.myflynai.com/signup to create your own account')
    console.log('3. Use any of the credentials above to sign in')
    console.log('\nNote: Passwords are hashed in Firebase. Use exact credentials as shown above.')
    console.log('═'.repeat(70) + '\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

setupTestAccounts()
