self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "UrbanWatch";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/vite.svg",
    badge: "/vite.svg",
    data: data.url || "/",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || "/"));
});
