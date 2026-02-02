import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

/**
 * Initialize Firebase for Web Push Notification (FCM).
 *
 * Requirements:
 * - Use Firebase Web SDK v9 (modular)
 * - Read config from import.meta.env (VITE_FIREBASE_*)
 * - Export firebaseApp and messaging instance
 * - Do NOT register service worker here
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);

// NOTE: Do not register service worker here.
export const messaging = getMessaging(firebaseApp);
