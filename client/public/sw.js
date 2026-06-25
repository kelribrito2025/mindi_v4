// Service Worker para Cardápio Admin PWA
// Atualizado para evitar tela branca causada por HTML/assets antigos presos no cache.
const CACHE_VERSION = '20260619-cache-bust';
const CACHE_NAME = `cardapio-admin-${CACHE_VERSION}`;
const STATIC_CACHE = `cardapio-static-${CACHE_VERSION}`;

// Não cachear a navegação raiz/HTML. O HTML precisa vir sempre da rede para apontar
// para os bundles atuais gerados pelo Vite.
const STATIC_ASSETS = [
  '/manifest.json?v=20260531oficial',
  '/icons/icon-192x192-20260531oficial.png',
  '/icons/icon-512x512-20260531oficial.png'
];

const isManagedCache = (cacheName) =>
  cacheName.startsWith('cardapio-admin-') ||
  cacheName.startsWith('cardapio-static-') ||
  cacheName === 'cardapio-admin-v2' ||
  cacheName === 'cardapio-static-v2';

const cacheAssetSafely = async (cache, asset) => {
  try {
    await cache.add(asset);
  } catch (error) {
    console.warn('[SW] Falha ao pré-cachear asset:', asset, error);
  }
};

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.all(STATIC_ASSETS.map((asset) => cacheAssetSafely(cache, asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames.map((cacheName) => {
          if (isManagedCache(cacheName) && cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve(false);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH HANDLER - REMOVIDO INTENCIONALMENTE
// ============================================================
// O fetch handler anterior interceptava requisições GET e podia
// entrar em conflito com o roteamento SPA, SSE/tRPC e cliques em
// push notifications. Mantemos apenas o pré-cache mínimo de ícones
// e manifest; HTML, bundles e APIs ficam sob controle do navegador
// e dos headers HTTP normais.
// ============================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);

  let data = {
    title: 'Novo Pedido!',
    body: 'Você recebeu um novo pedido',
    icon: '/icons/icon-192x192-20260531oficial.png',
    badge: '/icons/icon-96x96-20260531oficial.png',
    tag: 'new-order',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/pedidos'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192-20260531oficial.png',
    badge: data.badge || '/icons/icon-96x96-20260531oficial.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction !== false,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Ver Pedido' },
      { action: 'close', title: 'Fechar' }
    ],
    silent: false,
    // REMOVIDO: renotify: true
    // renotify podia reexibir a mesma notificação e refocar a aba,
    // causando efeitos colaterais de navegação/reload em alguns browsers.
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/pedidos';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada:', event);
});

self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_STATUS') {
    event.ports[0].postMessage({
      type: 'STATUS',
      isActive: true,
      cacheVersion: CACHE_NAME
    });
  }
});

self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker carregado:', CACHE_VERSION);
