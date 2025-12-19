// Import Firebase Core
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBz1XuYvXcRKtPnFsC10J_CvvMLF7wtPZU",
  authDomain: "mychat-6ea95.firebaseapp.com",
  projectId: "mychat-6ea95",
  storageBucket: "mychat-6ea95.firebasestorage.app",
  messagingSenderId: "818325828850",
  appId: "1:818325828850:web:ce21074620f79f68b1cc6b",
  measurementId: "G-2FNE8K8KF4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth
export const auth = getAuth(app);

export default app;
