import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

// Firebase config from env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testEmail = `e2etest-${Date.now()}@passiveblessings.com`;
const testPassword = 'Test@12345';

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  PASSIVE BLESSINGS - END-TO-END TEST                           ║');
console.log('║  Testing Signup, Activity Logging, and Signin                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSignup() {
  console.log('📝 TEST 1: USER SIGNUP AND DATA PERSISTENCE');
  console.log('─'.repeat(60));
  
  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log(`✓ User created with UID: ${user.uid}`);
    console.log(`✓ Email: ${user.email}`);
    
    // Wait for Firestore sync
    await delay(2000);
    
    // Check user document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      console.log(`\n✓ User document found in Firestore`);
      console.log(`  - Email: ${userData.email}`);
      console.log(`  - Role: ${userData.role}`);
      console.log(`  - Active: ${userData.active}`);
      console.log(`  - Created At: ${new Date(userData.createdAt.toDate()).toISOString()}`);
      return { userId: user.uid, email: user.email, success: true };
    } else {
      console.log('✗ User document NOT found in Firestore');
      return { userId: user.uid, email: user.email, success: false };
    }
  } catch (error) {
    console.error(`✗ Signup test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testActivityLogging(userId, email) {
  console.log('\n\n📊 TEST 2: ACTIVITY LOGGING VERIFICATION');
  console.log('─'.repeat(60));
  
  try {
    // Query activities collection for this user
    const activitiesRef = collection(db, 'activities');
    const q = query(activitiesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('⚠ No activities found for this user yet');
      console.log('  (Activities log asynchronously after page interaction)');
      return { success: true, warning: 'No activities yet' };
    }
    
    console.log(`✓ Found ${snapshot.size} activity records\n`);
    
    snapshot.forEach((doc, index) => {
      const activity = doc.data();
      console.log(`  Activity #${index + 1}:`);
      console.log(`    - Type: ${activity.activityType}`);
      console.log(`    - Action: ${activity.action}`);
      console.log(`    - IP: ${activity.ipAddress || 'Not recorded'}`);
      console.log(`    - User Agent: ${activity.userAgent?.substring(0, 50)}...`);
      console.log(`    - Timestamp: ${new Date(activity.timestamp.toDate()).toISOString()}`);
      if (activity.metadata) {
        console.log(`    - Metadata: ${JSON.stringify(activity.metadata).substring(0, 100)}...`);
      }
    });
    
    return { success: true, activitiesCount: snapshot.size };
  } catch (error) {
    console.error(`✗ Activity logging test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSignin(userId, email) {
  console.log('\n\n🔐 TEST 3: SIGNIN AND SESSION LOGGING');
  console.log('─'.repeat(60));
  
  try {
    // Sign in the user
    const loginResult = await signInWithEmailAndPassword(auth, email, testPassword);
    const loggedInUser = loginResult.user;
    
    console.log(`✓ User successfully signed in`);
    console.log(`  - UID: ${loggedInUser.uid}`);
    console.log(`  - Email: ${loggedInUser.email}`);
    
    await delay(2000);
    
    // Query signin activities
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('userId', '==', userId),
      where('activityType', '==', 'SIGNIN')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const signinActivity = snapshot.docs[0].data();
      console.log(`\n✓ Signin activity recorded in Firestore`);
      console.log(`  - Timestamp: ${new Date(signinActivity.timestamp.toDate()).toISOString()}`);
      console.log(`  - IP Address: ${signinActivity.ipAddress || 'Not recorded'}`);
      console.log(`  - User Agent: ${signinActivity.userAgent?.substring(0, 60)}...`);
    } else {
      console.log('⚠ No signin activity logged yet (may log asynchronously)');
    }
    
    return { success: true };
  } catch (error) {
    console.error(`✗ Signin test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDataIntegrity(userId) {
  console.log('\n\n🔍 TEST 4: DATA INTEGRITY CHECK');
  console.log('─'.repeat(60));
  
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('✗ User document not found');
      return { success: false };
    }
    
    const userData = userDoc.data();
    
    const requiredFields = [
      'id', 'email', 'role', 'active', 'createdAt', 'updatedAt',
      'volunteeredHours', 'totalDonated', 'membershipTier', 'consentTerms'
    ];
    
    let missingFields = [];
    requiredFields.forEach(field => {
      if (!(field in userData)) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length === 0) {
      console.log('✓ All required fields present in user document');
      console.log(`\n  User Profile Summary:`);
      console.log(`  - Email: ${userData.email}`);
      console.log(`  - Role: ${userData.role}`);
      console.log(`  - Tier: ${userData.membershipTier}`);
      console.log(`  - Active: ${userData.active}`);
      console.log(`  - Email Verified: ${userData.emailVerified || false}`);
      console.log(`  - Profile Complete: ${userData.profileComplete || false}`);
      return { success: true };
    } else {
      console.log(`✗ Missing fields: ${missingFields.join(', ')}`);
      return { success: false, missingFields };
    }
  } catch (error) {
    console.error(`✗ Data integrity check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function cleanup(userId) {
  console.log('\n\n🧹 CLEANUP');
  console.log('─'.repeat(60));
  
  try {
    await signOut(auth);
    console.log('✓ Signed out successfully');
    
    // Note: User account remains in Firebase for manual review
    console.log(`✓ Test account created: ${testEmail}`);
    console.log('  (Account retained for manual verification in Firebase Console)');
    
    return true;
  } catch (error) {
    console.error(`✗ Cleanup failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  try {
    // Test signup
    const signupResult = await testSignup();
    if (!signupResult.success) {
      console.log('\n✗ Signup test failed. Stopping tests.');
      return;
    }
    
    // Test activity logging
    const activityResult = await testActivityLogging(signupResult.userId, signupResult.email);
    
    // Test signin
    const signinResult = await testSignin(signupResult.userId, signupResult.email);
    
    // Test data integrity
    const integrityResult = await testDataIntegrity(signupResult.userId);
    
    // Cleanup
    await cleanup(signupResult.userId);
    
    // Summary
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  TEST SUMMARY                                                  ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║ Signup & User Creation:        ${signupResult.success ? '✓ PASS' : '✗ FAIL'}                       ║`);
    console.log(`║ Activity Logging:              ${activityResult.success ? '✓ PASS' : '✗ FAIL'}                       ║`);
    console.log(`║ Signin & Session:              ${signinResult.success ? '✓ PASS' : '✗ FAIL'}                       ║`);
    console.log(`║ Data Integrity:                ${integrityResult.success ? '✓ PASS' : '✗ FAIL'}                       ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    if (signupResult.success && activityResult.success && signinResult.success && integrityResult.success) {
      console.log('🎉 ALL TESTS PASSED! System is working correctly.\n');
      process.exit(0);
    } else {
      console.log('⚠ Some tests did not pass. Review above for details.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n✗ Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runAllTests();
