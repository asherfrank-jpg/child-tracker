import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkVDK_JZc8erLM--XyJ727GijQ6QXpsPE",
  authDomain: "seaktrack.firebaseapp.com",
  projectId: "seaktrack",
  storageBucket: "seaktrack.firebasestorage.app",
  messagingSenderId: "316581965185",
  appId: "1:316581965185:web:2210c64a8feff1e0550c80",
};

const app = initializeApp(firebaseConfig);

export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();