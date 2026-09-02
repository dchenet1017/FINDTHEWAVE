import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { config, warnOnMissingOptionalEnv } from './config'
import { checkDatabase, connectWithRetry, prisma } from './lib/prisma'
import { authRoutes } from './modules/auth/auth.routes'
import adminRoutes from './modules/admin/admin.routes'
import { businessRoutes } from './modules/businesses/business.routes'
import businessOwnerRoutes from './modules/business/business.routes'
import { checkInRoutes } from './modules/checkins/checkin.routes'
import { communityRoutes } from './modules/communities/community.routes'
import { userRoutes } from './modules/users/user.routes'
import { waveleaderRoutes } from './modules/waveleader/waveleader.routes'
import { waveleadersPublicRoutes } from './modules/waveleaders-public/waveleaders-public.routes'
import bookingRoutes from './modules/bookings/booking.routes'
import paymentRoutes from './modules/payments/payment.routes'
import eventRoutes from './modules/events/event.routes'
import crawlRoutes from './modules/crawls/crawl.routes'
import businessCrawlsRoutes from './modules/business/business-crawls.routes'
import notificationRoutes from './modules/notifications/notification.routes'
import goOutRoutes from './modules/go-out/go-out.routes'
import inviteRoutes from './modules/invites/invite.routes'
import { errorHandler } from './middleware/errorHandler'
import { successResponse } from './utils/response'

const server = Fastify({
  logger: config.isDev,
})

// Register plugins
// Built from FRONTEND_URL + CORS_ORIGINS; localhost is included off-production.
const allowedOrigins = config.cors.origins

await server.register(cors, {
  origin: (origin, cb) => {
    // allow non-browser / same-origin requests (curl, health checks)
    if (!origin) return cb(null, true)

    const normalizedOrigin = origin.replace(/\/$/, '')
    if (allowedOrigins.includes(normalizedOrigin)) {
      return cb(null, true)
    }

    // Opt-in only. Because credentials are enabled, allowing every
    // *.onrender.com origin would let any app hosted on Render make
    // authenticated calls against this API. Set ALLOW_ALL_RENDER_ORIGINS=true
    // to restore the old behaviour while sorting out FRONTEND_URL.
    if (config.cors.allowAllRenderOrigins && normalizedOrigin.endsWith('.onrender.com')) {
      return cb(null, true)
    }

    server.log.warn({ origin }, 'CORS: origin not in allowlist')
    return cb(new Error('Origin not allowed'), false)
  },
  credentials: true,
})

await server.register(cookie)

await server.register(jwt, {
  secret: config.jwt.secret,
})

// Error handler
server.setErrorHandler(errorHandler)

// Routes
await server.register(authRoutes, { prefix: '/api/auth' })
await server.register(adminRoutes, { prefix: '/api/admin' })
await server.register(businessRoutes, { prefix: '/api/businesses' })
await server.register(businessOwnerRoutes, { prefix: '/api/business' })
await server.register(checkInRoutes, { prefix: '/api/checkins' })
await server.register(communityRoutes, { prefix: '/api/communities' })
await server.register(userRoutes, { prefix: '/api/users' })
await server.register(waveleaderRoutes, { prefix: '/api/waveleader' })
await server.register(waveleadersPublicRoutes, { prefix: '/api/waveleaders' })
await server.register(bookingRoutes, { prefix: '/api/bookings' })
await server.register(paymentRoutes, { prefix: '/api/payments' })
await server.register(eventRoutes, { prefix: '/api/events' })
await server.register(crawlRoutes, { prefix: '/api/crawls' })
await server.register(businessCrawlsRoutes, { prefix: '/api/business/crawls' })
await server.register(notificationRoutes, { prefix: '/api/notifications' })
await server.register(goOutRoutes, { prefix: '/api/go-out' })
await server.register(inviteRoutes, { prefix: '/api/invites' })

/**
 * Liveness. Deliberately does not touch the database: this is what Render
 * polls, and a health check that fails on a database blip would take the whole
 * service down instead of letting it ride out the reconnect.
 */
server.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}))

/** Same probe under the /api prefix, kept for existing callers. */
server.get('/api/health', async () => {
  return successResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

/**
 * Readiness: can this instance actually serve traffic? Reports the database,
 * so use it when diagnosing a deploy - not as the health check path.
 */
server.get('/health/ready', async (_request, reply) => {
  const databaseUp = await checkDatabase()
  return reply.code(databaseUp ? 200 : 503).send({
    status: databaseUp ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: { database: databaseUp ? 'up' : 'down' },
  })
})

// Start server
const start = async () => {
  try {
    warnOnMissingOptionalEnv()

    // Listen before connecting so /health answers straight away. A managed
    // database is often still waking when the web service boots, and a deploy
    // should not be failed over a cold database that comes up seconds later.
    await server.listen({ port: config.port, host: '0.0.0.0' })
    console.log(`🚀 Server running on port ${config.port}`)
    console.log(`📝 Environment: ${config.nodeEnv}`)
    console.log(`🌐 Frontend URL: ${config.frontend.url}`)
    console.log(`🔓 CORS allowlist: ${allowedOrigins.join(', ') || '(none)'}`)
    if (config.cors.allowAllRenderOrigins) {
      console.warn('⚠️  ALLOW_ALL_RENDER_ORIGINS is on — every *.onrender.com origin is permitted')
    }

    // Deliberately not fatal: the process stays up so /health/ready can report
    // the database as down, which is far easier to diagnose than a crash loop.
    // The retry middleware in lib/prisma reconnects once it is reachable.
    await connectWithRetry().catch(() => {
      console.error(
        '❌ Started without a database connection. /health/ready will report ' +
          'degraded and API routes will fail until it recovers.'
      )
    })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down gracefully...`)
    await server.close()
    // Release the pool so the database doesn't hold the connection open.
    await prisma.$disconnect().catch(() => {})
    process.exit(0)
  })
})

start()
