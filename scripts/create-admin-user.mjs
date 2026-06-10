import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import * as crypto from "crypto";
import * as readline from "readline";

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

function generateAccessCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function createAdminUser() {
  try {
    const email = "admin@passiveblessings.com";
    const password = "Admin@PassiveBlessing2025";
    const accessCode = generateAccessCode();

    console.log("\n=== Creating Admin User ===");
    console.log("Creating Firebase Auth user...");
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("Creating admin profile in Firestore...");
    
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      email,
      firstName: "Admin",
      lastName: "Dashboard",
      role: "admin",
      accessCode,
      membershipTier: "premium",
      volunteeredHours: 0,
      totalDonated: 0,
      memberSince: new Date().toISOString(),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log("\n✅ Admin user created successfully!\n");
    console.log("=== Admin Login Credentials ===");
    console.log(`Access Code: ${accessCode}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("\nLogin URL: https://v0-ppbb.vercel.app/login");
    console.log("Admin Panel: https://v0-ppbb.vercel.app/admin");
    console.log("\n=== Login Flow ===");
    console.log("1. Click 'Admin Login' at the bottom of the login page");
    console.log("2. Enter the Access Code");
    console.log("3. Enter Email and Password");
    console.log("4. You'll be directed to the admin dashboard\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating admin user:", error.message);
    if (error.code === "auth/email-already-in-use") {
      console.log("\nℹ️  Admin user already exists. Using existing credentials:");
      console.log("Access Code: Check your Firestore users collection");
      console.log("Email: admin@passiveblessings.com");
    }
    process.exit(1);
  }
}

createAdminUser();
