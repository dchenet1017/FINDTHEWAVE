import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Prisma error codes that mean the query never reached the database, so
 * re-running it is safe even for writes.
 *
 *   P1001 - can't reach the database server
 *   P1017 - server closed the connection
 *   P2024 - timed out fetching a connection from the pool
 */
const RETRYABLE_CODES = new Set(['P1001', 'P1017', 'P2024'])

const MAX_QUERY_RETRIES = 2
const QUERY_RETRY_BASE_MS = 150

function isRetryable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return !error.errorCode || RETRYABLE_CODES.has(error.errorCode)
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_CODES.has(error.code)
  }
  return false
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let retryMiddlewareInstalled = false

/**
 * Retry queries that failed because the connection dropped.
 *
 * Render's free Postgres drops idle connections and restarts during
 * maintenance; without this, the first request after a drop fails even though
 * the pool recovers immediately after. Only the codes above are retried, all of
 * which mean the statement never ran, so this cannot double-apply a write.
 */
function installRetryMiddleware() {
  if (retryMiddlewareInstalled) return
  retryMiddlewareInstalled = true

  prisma.$use(async (params, next) => {
    let lastError: unknown

    for (let attempt = 0; attempt <= MAX_QUERY_RETRIES; attempt++) {
      try {
        return await next(params)
      } catch (error) {
        lastError = error
        if (!isRetryable(error) || attempt === MAX_QUERY_RETRIES) throw error

        const delay = QUERY_RETRY_BASE_MS * 2 ** attempt
        console.warn(
          `[prisma] ${params.model ?? 'raw'}.${params.action} failed on a dropped ` +
            `connection, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_QUERY_RETRIES})`
        )
        await sleep(delay)
        // Re-establish before the next attempt; harmless if already connected.
        try {
          await prisma.$connect()
        } catch {
          // the retry itself will surface a still-unreachable database
        }
      }
    }

    throw lastError
  })
}

/**
 * Connect at boot, retrying with exponential backoff.
 *
 * A managed Postgres instance is often still waking up when the web service
 * starts, so a single $connect() can lose a deploy to a cold database.
 */
export async function connectWithRetry(
  maxAttempts = 10,
  baseDelayMs = 500
): Promise<void> {
  installRetryMiddleware()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect()
      if (attempt > 1) console.log(`✅ Database connected after ${attempt} attempts`)
      return
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(
          `❌ Could not reach the database after ${maxAttempts} attempts.`,
          error
        )
        throw error
      }

      // Cap the backoff so a slow start doesn't stall the deploy for minutes.
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 10_000)
      console.warn(
        `[prisma] database unreachable (attempt ${attempt}/${maxAttempts}), ` +
          `retrying in ${delay}ms`
      )
      await sleep(delay)
    }
  }
}

/** Cheap liveness probe for the readiness endpoint. */
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
