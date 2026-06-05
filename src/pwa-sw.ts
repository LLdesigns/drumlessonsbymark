/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Activate new service worker immediately so cached CSS/assets update after deploy
self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// SPA: serve index.html for client-side routes (refresh on /studio/... etc.)
const navigationHandler = createHandlerBoundToURL('/index.html')
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/\/[^/?]+\.[^/]+$/],
  })
)

// Static images and fonts from same origin — cache first
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    request.destination === 'font' ||
    /\.(png|svg|woff2?|webp)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'studio-static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
)

// CDN styles/fonts (bootstrap icons, google fonts) — stale-while-revalidate
registerRoute(
  ({ url }) =>
    url.origin === 'https://cdn.jsdelivr.net' ||
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'studio-cdn-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
)

self.addEventListener('push', (event) => {
  let payload: { title?: string; body?: string; url?: string } = {}
  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { body: event.data?.text() }
  }

  const title = payload.title ?? "Mark's Drum Studio"
  const options: NotificationOptions = {
    body: payload.body ?? 'You have a new update.',
    icon: '/logoMP.svg',
    badge: '/logoMP.svg',
    data: { url: payload.url ?? '/app' },
    tag: 'studio-notification',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? '/app'
  const fullUrl = new URL(url, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return self.clients.openWindow(fullUrl)
    })
  )
})
