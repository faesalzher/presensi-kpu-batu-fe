import { useEffect } from "react";
import { onMessage, type MessagePayload } from "firebase/messaging";
import { messaging } from "../lib/firebase";

/**
 * Handle Firebase push notifications when app is in foreground.
 *
 * Requirements:
 * - Use onMessage from firebase/messaging
 * - Show browser Notification manually
 * - Only run when Notification.permission === "granted"
 */
export const useForegroundPush = (): void => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
      const title = payload?.data?.title ?? "Notifikasi";
      const body = payload?.data?.body ?? "";
      const icon = payload?.data?.icon ?? "/logo.png";

      // Browser Notification (manual) for foreground messages
      try {
        // eslint-disable-next-line no-new
        new Notification(title, { body, icon });
      } catch {
        // ignore
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
};

export default useForegroundPush;
