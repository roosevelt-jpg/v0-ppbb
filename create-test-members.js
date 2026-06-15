// Use native Node.js fetch (available in Node 18+)

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!projectId || !apiKey) {
  console.error('[v0] ERROR: Missing Firebase projectId or apiKey');
  process.exit(1);
}

console.log('[v0] Using Firebase REST API to create test members...\n');

async function createTestMember(email, password, firstName, lastName) {
  try {
    console.log(`[v0] Creating member: ${email}`);

    // Sign up new user
    const signUpResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password,
        displayName: `${firstName} ${lastName}`,
        returnSecureToken: true,
      }),
    });

    const signUpData = await signUpResponse.json();

    if (!signUpResponse.ok) {
      if (signUpData.error?.message === 'EMAIL_EXISTS') {
        console.log(`⊘ Already exists: ${email}`);
        return true;
      }
      throw new Error(signUpData.error?.message || 'Sign up failed');
    }

    const uid = signUpData.localId;
    const idToken = signUpData.idToken;

    console.log(`✓ Created Firebase auth user: ${uid}`);

    // Create Firestore document
    const firestoreResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            email: { stringValue: email },
            firstName: { stringValue: firstName },
            lastName: { stringValue: lastName },
            displayName: { stringValue: `${firstName} ${lastName}` },
            membershipTier: { stringValue: 'standard' },
            role: { stringValue: 'member' },
            bio: { stringValue: '' },
            profilePicture: { stringValue: '' },
            phoneNumber: { stringValue: '' },
            location: { stringValue: '' },
            volunteerHours: { integerValue: 0 },
            eventsAttended: { integerValue: 0 },
            donations: { integerValue: 0 },
            certificateCount: { integerValue: 0 },
            createdAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );

    if (!firestoreResponse.ok) {
      const error = await firestoreResponse.json();
      console.log(`⚠ Firestore doc create failed (may already exist): ${error.error?.message || 'unknown error'}`);
      return true;
    }

    console.log(`✓ Created Firestore document\n`);
    return true;
  } catch (error) {
    console.error(`✗ Error with ${email}: ${error.message}\n`);
    return false;
  }
}

async function main() {
  const members = [
    { email: 'member1@passiveblessings.ae', password: 'Member@123456', firstName: 'Ahmed', lastName: 'Al-Mansouri' },
    { email: 'member2@passiveblessings.ae', password: 'Member@123456', firstName: 'Fatima', lastName: 'Al-Zahra' },
    { email: 'member3@passiveblessings.ae', password: 'Member@123456', firstName: 'Mohammed', lastName: 'Al-Qasimi' },
    { email: 'member4@passiveblessings.ae', password: 'Member@123456', firstName: 'Aisha', lastName: 'Al-Noor' },
    { email: 'member5@passiveblessings.ae', password: 'Member@123456', firstName: 'Hassan', lastName: 'Al-Tamimi' },
  ];

  console.log('[v0] ========================================\n');
  console.log('[v0] Creating test member accounts...\n');

  for (const member of members) {
    await createTestMember(member.email, member.password, member.firstName, member.lastName);
  }

  console.log('[v0] ========================================');
  console.log('[v0] Test member creation complete!\n');
  console.log('[v0] You can now login with any of these credentials:\n');
  console.log('  Email: member1@passiveblessings.ae');
  console.log('  Password: Member@123456\n');
  console.log('  (or member2, member3, member4, member5 with same password)\n');
  console.log('[v0] Login URL: https://test.myflynai.com/login\n');

  process.exit(0);
}

main().catch(error => {
  console.error('[v0] Fatal error:', error.message);
  process.exit(1);
});
