/**
 * Firebase Cloud Messaging service worker.
 *
 * Requirements:
 * - Use firebase-app-compat and firebase-messaging-compat
 * - Initialize Firebase using the same web config
 * - Handle background push notifications only
 * - Show notification using title & body from payload.data
 * - Do NOT use onMessage here
 */

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// Same Firebase web config as the frontend (VITE_FIREBASE_*)
firebase.initializeApp({
  apiKey: "AIzaSyCnSWTa_GaXg0QcamyNIAlR3nFFhkgphy8",
  authDomain: "presnesi-kpu-batu.firebaseapp.com",
  projectId: "presnesi-kpu-batu",
  storageBucket: "presnesi-kpu-batu.firebasestorage.app",
  messagingSenderId: "19688762069",
  appId: "1:19688762069:web:4ab03ac12050a2e1c0505c",
});

const messaging = firebase.messaging();

// Background notifications only (no onMessage here)
messaging.onBackgroundMessage((payload) => {
  const title = payload?.data?.title || "Notifikasi";
  const body = payload?.data?.body || "";
  const icon = payload?.data?.icon || "/logo.png";

  self.registration.showNotification(title, {
    body,
    icon,
    // Keep payload for debugging/click handling later if needed
    data: payload?.data,
  });
});


