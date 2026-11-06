import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

// Firebase Client Configuration
// Reads from Vite environment variables or uses active project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBTu65R-W6WhJ5VI2PcpMlJOe_rb7FpXsg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "technovate-c048c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "technovate-c048c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "technovate-c048c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "429106293491",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:429106293491:web:b1dcefd2548588c2e52586",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KMZG25M7N6"
};

let app;
let auth;
let isDemoAuth = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
} catch (e) {
  console.warn("[Firebase] Initializing in local developer mode:", e.message);
  isDemoAuth = true;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  updateProfile,
  isDemoAuth
};
