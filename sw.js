/* Ao publicar uma mudança nos arquivos abaixo, incremente VERSION.
 * Cache estritamente público: nenhuma configuração, sessão, foto ou registro.
 * A navegação sempre busca a versão online; offline abre uma tela explicativa.
 */
'use strict';
const VERSION = 'v1';
const PREFIX = 'viva-pwa:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const publicFiles = [
  'offline.html', 'manifest.webmanifest', 'icons/viva.svg',
  'icons/viva-192.png', 'icons/viva-512.png',
  'icons/viva-maskable-512.png', 'icons/apple-touch-icon.png'
].map(file => new URL(file, self.registration.scope).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(publicFiles)));
  // Sem skipWaiting automático: uma atualização não interrompe formulários.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'VIVA_ACTIVATE_UPDATE') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      return (await caches.open(CACHE)).match(new URL('offline.html', self.registration.scope).href);
    }));
    return;
  }
  // Query strings não entram na lista: inclui callbacks e URLs assinadas.
  if (!publicFiles.includes(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(request)) || fetch(request);
  })());
});
