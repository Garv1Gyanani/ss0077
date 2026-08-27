import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCw-O4hEmfKxzB13j4Al7tViVLUH_J6d-U",
  authDomain: "strangely-2267e.firebaseapp.com",
  projectId: "strangely-2267e",
  storageBucket: "strangely-2267e.firebasestorage.app",
  messagingSenderId: "803202122401",
  appId: "1:803202122401:web:a6ac0ca7048e1f5f8be6e0",
  measurementId: "G-XFVSR9QSN1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  ref,
  onValue
};
