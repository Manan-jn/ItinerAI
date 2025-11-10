// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdUTUNW31w5sYVc8jaWjh8_BGJrcoDDdE",
  authDomain: "itinerai-41751.firebaseapp.com",
  projectId: "itinerai-41751",
  storageBucket: "itinerai-41751.firebasestorage.app",
  messagingSenderId: "274602328761",
  appId: "1:274602328761:web:965a63d7501d09ebe75168",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
