import { prisma } from './prisma'

/** How long to trust a failed probe before trying the extension again */
const RETRY_AFTER_MS = 10 * 60 * 1000

let available: boolean | null = null
let checkedAt = 0
let probing: Promise<boolean> | null = null

/**
 * Whether PostGIS can be used, enabling it on first call.
 *
 * Both outcomes are remembered. Remembering only success meant a database
 * without the extension (local postgres:15-alpine, or a role that may not
 * create extensions) re-ran CREATE EXTENSION and logged a stack trace on every
 * geo request - thousands a minute under load.
 */
export function postgisAvailable(): Promise<boolean> {
  if (available === true) return Promise.resolve(true)
  if (available === false && Date.now() - checkedAt < RETRY_AFTER_MS) {
    return Promise.resolve(false)
  }
  if (probing) return probing

  probing = prisma
    .$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis')
    .then(() => true)
    .catch((err: unknown) => {
      console.warn(
        'PostGIS unavailable, using bounding-box + haversine fallback:',
        err instanceof Error ? err.message.split('\n').slice(-1)[0] : err
      )
      return false
    })
    .then((ok) => {
      available = ok
      checkedAt = Date.now()
      probing = null
      return ok
    })
  return probing
}
