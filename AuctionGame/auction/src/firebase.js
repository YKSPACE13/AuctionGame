import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "auction-63d16.firebaseapp.com",
  projectId: "auction-63d16",
  storageBucket: "auction-63d16.firebasestorage.app",
  messagingSenderId: "1047064775228",
  appId: "1:1047064775228:web:0fba96af96eac6b1d31139",
  measurementId: "G-BEEZQLM04Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Admin credentials (for demo purposes only - in production, use Firebase Admin SDK on the server)
export const ADMIN_CREDENTIALS = {
  email: 'admin@admin.com',
  password: 'admin123'
};
