// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY, // Your Firebase API key
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN, // Your Firebase Auth domain
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID, // Your Firebase project ID
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET, // Your Firebase Storage bucket
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID, // Optional: Add this if needed
  appId: process.env.NEXT_PUBLIC_APP_ID, // Optional: Add this if needed
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export initialized services
export { auth, db, storage };
