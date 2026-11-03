self.addEventListener("push", (event) => {
  let d = { title: "Gesto", body: "Tu as une échéance.", url: "/echeances", tag: "gesto" };
  try { d = { ...d, ...event.data.json() }; } catch (e) {}
  event.waitUntil(self.registration.showNotification(d.title, { body: d.body, tag: d.tag, data: { url: d.url }, requireInteraction: true, icon: "/icon.svg", badge: "/icon.svg" }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/echeances";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
