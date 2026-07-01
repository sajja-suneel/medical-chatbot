// frontend/lib/firebase.ts

import { initializeApp, getApps, getApp,} from 'firebase/app';
import { getAuth } from 'firebase/auth';
 

const firebaseConfig = {
  apiKey: "AIzaSyCPhfDy7FOFsvPueMq3apbiVK9RjHIDqhw",
  authDomain: "healthcare-chatbot-4f585.firebaseapp.com",
  projectId: "healthcare-chatbot-4f585",
  storageBucket: "healthcare-chatbot-4f585.firebasestorage.app",
  messagingSenderId: "1091407216303",
  appId: "1:1091407216303:web:557fbed00f8d05b808de5a",
  measurementId: "G-ZL0TZ951SD"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Auth instance
export const auth = getAuth(app);