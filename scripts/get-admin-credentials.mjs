import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import * as crypto from "crypto";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateAccessCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function setupAdminAccessCode() {
  try {
    const email = "admin@passiveblessings.com";
    const accessCode = generateAccessCode();

    console.log("\n=== Setting Up Admin Access Code ===\n");
    
    // Find the admin user
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const adminDoc = querySnapshot.docs[0];
      
      // Update with new access code
      await updateDoc(adminDoc.ref, {
        accessCode: accessCode,
        updatedAt: new Date().toISOString(),
      });

      console.log("✅ Admin Access Code Set Successfully!\n");
      console.log("=== Admin Login Credentials ===");
      console.log(`Email: ${email}`);
      console.log(`Password: Admin@PassiveBlessing2025`);
      console.log(`Access Code: ${accessCode}`);
      console.log("\n=== How to Login ===");
      console.log("1. Go to: https://v0-ppbb.vercel.app/login");
      console.log("2. Click 'Admin Login'");
      console.log("3. Enter Access Code: " + accessCode);
      console.log("4. Enter Email: " + email);
      console.log("5. Enter Password: Admin@PassiveBlessing2025");
      console.log("6. Click Sign In");
      console.log("7. You'll be redirected to: https://v0-ppbb.vercel.app/admin\n");
    } else {
      console.log("❌ Admin user not found in Firestore");
      console.log("Please create the admin user first.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

setupAdminAccessCode();
