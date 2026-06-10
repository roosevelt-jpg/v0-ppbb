import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    const email = "admin@passiveblessings.com";
    const password = "Admin@123456";

    console.log("Creating admin user...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("Creating admin profile in Firestore...");
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      email,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      membershipTier: "premium",
      volunteeredHours: 0,
      totalDonated: 0,
      memberSince: new Date().toISOString(),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log("\n✓ Admin user created successfully!");
    console.log("\nAdmin Credentials:");
    console.log("Email: admin@passiveblessings.com");
    console.log("Password: Admin@123456");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

createAdminUser();
