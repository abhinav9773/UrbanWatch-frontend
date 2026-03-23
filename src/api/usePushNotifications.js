import { useEffect } from "react";
import api from "./axios";

export const usePushNotifications = (user) => {
  useEffect(() => {
    if (!user || !("serviceWorker" in navigator) || !("PushManager" in window))
      return;

    const register = async () => {
      try {
        // Get VAPID public key
        const { data } = await api.get("/push/vapid-key");
        const vapidKey = data.publicKey;

        // Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js");

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
        console.error("Push setup failed:", err);
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
