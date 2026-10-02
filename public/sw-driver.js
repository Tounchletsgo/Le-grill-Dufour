const CACHE_NAME = "gdf-driver-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("push", (e) => {
  let data = { title: "Le Grill Dufour", body: "Nouvelle notification" };
  try {
    if (e.data) {
      data = e.data.json();
    }
  } catch {}

  const options = {
    body: data.body,
    icon: "/favicon-192.png",
    badge: "/favicon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "gdf-driver",
    renotify: true,
    data: { url: data.url || "/livreur" },
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/livreur";

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/livreur") && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
