// Script to create admin user in Firebase
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.development.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.private_key_id,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: "dummy",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
});

const auth = admin.auth();
const firestore = admin.firestore();

async function createAdminUser() {
  try {
    const email = 'admin@passiveblessings.com';
    const password = 'Admin@PassiveBlessing2025';

    console.log('[v0] Creating admin user in Firebase...');
    
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`[v0] User already exists with UID: ${userRecord.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email,
          password,
          displayName: 'Admin User',
        });
        console.log(`[v0] Admin user created with UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Create admin user record in Firestore
    await firestore.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    console.log('[v0] Admin user setup complete!');
    console.log(`[v0] Email: ${email}`);
    console.log(`[v0] Password: ${password}`);
    console.log('[v0] You can now login to the admin panel at: https://www.passive-blessings.com/admin/setup');

    process.exit(0);
  } catch (error) {
    console.error('[v0] Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
