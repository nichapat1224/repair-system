// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "firebase/firestore";

// Firebase Config ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyDF6LEIC-XsJlKU4AkR5RL41RGDzRfOf5Y",
  authDomain: "repair-tracking-system-302e1.firebaseapp.com",
  projectId: "repair-tracking-system-302e1",
  storageBucket: "repair-tracking-system-302e1.firebasestorage.app",
  messagingSenderId: "64075995279",
  appId: "1:64075995279:web:1c9c8200b5140ad42d38fa",
  measurementId: "G-RDTEVYJ3G7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
};