import { toast } from 'sonner'

/**
 * Registers /sw.js in production builds only. In dev the Vite server rewrites
 * modules on every save and a service worker would serve stale ones.
 *
 * When a new build is deployed the new worker waits instead of taking over
 * mid-session; the user gets a toast and the page reloads only when they ask.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      const promptUpdate = (worker: ServiceWorker) => {
        toast('A new version of WaveFinder is ready', {
          duration: Infinity,
          action: {
            label: 'Reload',
            onClick: () => worker.postMessage({ type: 'SKIP_WAITING' }),
          },
        })
      }

      // An update was already downloaded on a previous visit.
      if (registration.waiting && navigator.serviceWorker.controller) {
        promptUpdate(registration.waiting)
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          // A controller already exists means this is an update, not the first install.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            promptUpdate(worker)
          }
        })
      })

      // On a first visit clients.claim() also fires controllerchange; only an
      // update (page was already controlled) should trigger a reload.
      const hadController = !!navigator.serviceWorker.controller
      let reloading = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading || !hadController) return
        reloading = true
        window.location.reload()
      })

      // Long-lived installed apps rarely navigate, so check for updates hourly.
      setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
    } catch (err) {
      console.warn('Service worker registration failed', err)
    }
  })
}
