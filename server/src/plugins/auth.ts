import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { FastifyInstance } from 'fastify'

export default fp(async (fastify: FastifyInstance) => {
  // Register @fastify/jwt with secret from env
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  })

  // Add authenticate decorator
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      const authHeader = request.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided',
          },
        })
      }

      const token = authHeader.replace('Bearer ', '')

      if (!token) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided',
          },
        })
      }

      const decoded = fastify.jwt.verify<{
        userId: string
        role: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'
      }>(token)

      request.user = {
        userId: decoded.userId,
        role: decoded.role,
      }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired',
          },
        })
      }

      if (error.name === 'JsonWebTokenError') {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token',
          },
        })
      }

      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed',
        },
      })
    }
  })

  // Add requireRole decorator
  fastify.decorate(
    'requireRole',
    function (...allowedRoles: string[]) {
      return async (request: any, reply: any) => {
        if (!request.user) {
          return reply.code(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Not authenticated',
            },
          })
        }

        if (!allowedRoles.includes(request.user.role)) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          })
        }
      }
    }
  )
})

// Extend FastifyInstance types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>
    requireRole: (...roles: string[]) => (request: any, reply: any) => Promise<void>
  }
}

