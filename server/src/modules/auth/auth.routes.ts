import { FastifyInstance } from 'fastify'
import { AuthService } from './auth.service'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from './auth.schema'
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify)

  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body)
      const result = await authService.register(body)

      if (!result.success) {
        return reply.code(400).send(result)
      }

      return reply.code(201).send(result)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        })
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      })
    }
  })

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)
      const result = await authService.login(body.email, body.password)

      if (!result.success) {
        return reply.code(401).send(result)
      }

      return reply.send(result)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        })
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      })
    }
  })

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const body = refreshTokenSchema.parse(request.body)
      const result = await authService.refreshTokens(body.refreshToken)

      if (!result.success) {
        return reply.code(401).send(result)
      }

      return reply.send(result)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        })
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      })
    }
  })

  // Logout
  fastify.post('/logout', async (request, reply) => {
    try {
      const body = refreshTokenSchema.parse(request.body)
      const result = await authService.logout(body.refreshToken)

      if (!result.success) {
        return reply.code(400).send(result)
      }

      return reply.send(result)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        })
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      })
    }
  })

  // Verify email
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const body = verifyEmailSchema.parse(request.body)
      const result = await authService.verifyEmail(body.token)

      if (!result.success) {
        return reply.code(400).send(result)
      }

      return reply.send(result)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        })
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      })
    }
  })

  // Forgot password
  fastify.post('/forgot-password', async (request, reply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body)
      const result = await authService.forgotPassword(body.email)

      return reply.send(result)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        })
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      })
    }
  })

  // Reset password
  fastify.post('/reset-password', async (request, reply) => {
    try {
      const body = resetPasswordSchema.parse(request.body)
      const result = await authService.resetPassword(body.token, body.password)

      if (!result.success) {
        return reply.code(400).send(result)
      }

      return reply.send(result)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
          },
        })
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      })
    }
  })

  // Get current user (protected)
  fastify.get(
    '/me',
    { preHandler: authenticate },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const result = await authService.getCurrentUser(request.user.userId)

        if (!result.success) {
          return reply.code(404).send(result)
        }

        return reply.send(result)
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred',
          },
        })
      }
    }
  )
}

