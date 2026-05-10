import { useEffect } from "react";
import api from "./axios";

export const usePushNotifications = (user) => {
  useEffect(() => {
    if (!user) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const register = async () => {
      try {
        // Check current permission state first — don't attempt if already denied
        if (Notification.permission === "denied") return;

        // Get VAPID public key
        const { data } = await api.get("/push/vapid-key");
        const vapidKey = data.publicKey;

        // Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js");

        // Request permission only if not yet granted
        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return; // User said no — silent exit
        }

        // Check existing subscription
        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }

        // Send to backend
        const token = localStorage.getItem("token");
        await api.post(
          "/push/subscribe",
          { subscription },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err) {
        // Only log unexpected errors, not permission denials
        if (err?.name !== "NotAllowedError") {
          console.error("Push setup failed:", err);
        }
      }
    };

    register();
  }, [user]);
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}