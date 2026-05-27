import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA9DPra0m4opeEouxMat2URLyl3GJXYfvQ",
  authDomain: "komsu-8611a.firebaseapp.com",
  databaseURL: "https://komsu-8611a-default-rtdb.firebaseio.com",
  projectId: "komsu-8611a",
  storageBucket: "komsu-8611a.firebasestorage.app",
  messagingSenderId: "60117894712",
  appId: "1:60117894712:web:a01e1f0e67fb3d2fd348cd",
  measurementId: "G-T3G1RF89EC"
};

// Initialize Firebase
const isConfigured = true;
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, rtdb, auth, storage, isConfigured };
