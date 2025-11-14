// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2rj3ewn_vB_Qv_jeOjt_SK3I9biI8GjM",
  authDomain: "mathai-splitease.firebaseapp.com",
  projectId: "mathai-splitease",
  storageBucket: "mathai-splitease.firebasestorage.app",
  messagingSenderId: "779511872444",
  appId: "1:779511872444:web:91599d1ca373a328ee49b9",
  measurementId: "G-7LDGDV350P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);