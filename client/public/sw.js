/* WaveFinder service worker.
 *
 * Deliberately small and hand-written so there is no build plugin to keep in
 * step with Vite. What it does:
 *
 *   page navigations      network first, fall back to the cached app shell
 *                         so the installed app still opens offline
 *   /assets/* (hashed)    cache first; filenames change on every build
 *   icons, manifest       stale-while-revalidate
 *   API, Mapbox, Stripe   never touched: anything cross-origin or under /api
 *                         goes straight to the network, so no stale data,
 *                         auth responses or payment pages are ever cached
 *
 * Bump VERSION to force every client to drop its caches.
 */
const VERSION = 'v1'
const SHELL_CACHE = `wf-shell-${VERSION}`
const ASSET_CACHE = `wf-assets-${VERSION}`
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icons/pwa-192x192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE])
      for (const key of await caches.keys()) {
        if (key.startsWith('wf-') && !keep.has(key)) await caches.delete(key)
      }
      await self.clients.claim()
    })()
  )
})

// The page asks for this after the user accepts the "new version" toast.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function networkFirstShell(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      // Every route serves the same SPA shell, so store it under one key.
      cache.put('/index.html', response.clone())
    }
    return response
  } catch {
    const cached = await caches.match('/index.html')
    return cached || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)
  return cached || network
}
