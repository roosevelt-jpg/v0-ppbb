const admin = require('firebase-admin');

// Use environment variables directly
const serviceAccount = {
  type: "service_account",
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.private_key_id,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n') || process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: "1",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
  console.log('[v0] Firebase Admin initialized successfully');
} catch (error) {
  console.error('[v0] Firebase Admin initialization error:', error.message);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function createTestMembers() {
  const members = [
    { email: 'member1@passiveblessings.ae', password: 'Member@123456', firstName: 'Ahmed', lastName: 'Al-Mansouri' },
    { email: 'member2@passiveblessings.ae', password: 'Member@123456', firstName: 'Fatima', lastName: 'Al-Zahra' },
    { email: 'member3@passiveblessings.ae', password: 'Member@123456', firstName: 'Mohammed', lastName: 'Al-Qasimi' },
    { email: 'member4@passiveblessings.ae', password: 'Member@123456', firstName: 'Aisha', lastName: 'Al-Noor' },
    { email: 'member5@passiveblessings.ae', password: 'Member@123456', firstName: 'Hassan', lastName: 'Al-Tamimi' },
  ];

  console.log('\n[v0] Creating test member accounts...\n');

  for (const member of members) {
    try {
      // Try to get existing user
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(member.email);
        console.log(`⊘ Already exists: ${member.email}`);
      } catch (err) {
        // User doesn't exist, create it
        userRecord = await auth.createUser({
          email: member.email,
          password: member.password,
          displayName: `${member.firstName} ${member.lastName}`,
          emailVerified: true,
        });
        console.log(`✓ Created: ${member.email}`);
      }

      // Create/update Firestore user document
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        displayName: `${member.firstName} ${member.lastName}`,
        membershipTier: 'standard',
        role: 'member',
        bio: '',
        profilePicture: '',
        phoneNumber: '',
        location: '',
        volunteerHours: 0,
        eventsAttended: 0,
        donations: 0,
        certificateCount: 0,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      }, { merge: true });
      console.log(`✓ Firestore doc created/updated: ${member.email}\n`);
    } catch (error) {
      console.error(`✗ Error with ${member.email}:`, error.message, '\n');
    }
  }

  console.log('[v0] Test member creation complete!');
  console.log('\n[v0] You can now login with:');
  console.log('  Email: member1@passiveblessings.ae');
  console.log('  Password: Member@123456\n');

  process.exit(0);
}

createTestMembers().catch(error => {
  console.error('[v0] Fatal error:', error);
  process.exit(1);
});
