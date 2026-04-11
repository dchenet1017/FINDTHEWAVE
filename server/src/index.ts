import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { config } from './config'
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
import { errorHandler } from './middleware/errorHandler'
import { successResponse } from './utils/response'

const server = Fastify({
  logger: config.isDev,
})

// Register plugins
const allowedOrigins = [
  config.frontend.url.replace(/\/$/, ''), // strip trailing slash
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

await server.register(cors, {
  origin: (origin, cb) => {
    // allow non-browser / same-origin requests
    if (!origin) return cb(null, true)
    const normalizedOrigin = origin.replace(/\/$/, '')
    if (allowedOrigins.includes(normalizedOrigin)) {
      return cb(null, true)
    }
    // allow any onrender.com subdomain as fallback
    if (normalizedOrigin.endsWith('.onrender.com')) {
      return cb(null, true)
    }
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

// Health check
server.get('/api/health', async () => {
  return successResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Start server
const start = async () => {
  try {
    await server.listen({ port: config.port, host: '0.0.0.0' })
    console.log(`🚀 Server running on http://localhost:${config.port}`)
    console.log(`📝 Environment: ${config.nodeEnv}`)
    console.log(`🌐 Frontend URL: ${config.frontend.url}`)
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
    process.exit(0)
  })
})

start()
