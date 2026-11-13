// Lexa: service worker mínimo para que la app se pueda instalar en la pantalla de inicio.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
