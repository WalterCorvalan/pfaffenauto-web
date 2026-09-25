// Service worker de notificaciones push del panel (Web Push API). Solo se
// registra dentro de /panel (ver PushSubscribeButton.tsx) -- no interfiere
// con el sitio público, no cachea nada, su único trabajo es escuchar el
// evento "push" del navegador y mostrar la notificación nativa del
// dispositivo, y llevar al usuario al link correcto si la toca.

self.addEventListener("push", (event) => {
  let data = { title: "Pfaffen Autos", body: "", url: "/panel" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* payload no era JSON, se usa el default */
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Pfaffen Autos", {
      body: data.body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url || "/panel" },
      tag: data.url || undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/panel";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
