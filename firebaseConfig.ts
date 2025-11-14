// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

/**
 * Checks if the firebase config has been filled out.
 * @returns {boolean} True if the config is valid, false otherwise.
 */
export const isFirebaseConfigValid = () => {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
           firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
           firebaseConfig.authDomain !== "YOUR_AUTH_DOMAIN";
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };