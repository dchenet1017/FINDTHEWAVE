import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../utils/errors'
import { errorResponse } from '../utils/response'

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string
    /** Same as userId (Prisma User.id) */
    id: string
    role: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'
  }
}

/**
 * Authentication middleware
 * Extracts Bearer token from Authorization header and verifies JWT
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send(
        errorResponse('UNAUTHORIZED', 'No token provided')
      )
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return reply.code(401).send(
        errorResponse('UNAUTHORIZED', 'No token provided')
      )
    }

    // Verify JWT token
    const decoded = request.server.jwt.verify<{
      userId: string
      role: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'
    }>(token)

    // Attach user info to request
    ;(request as AuthenticatedRequest).user = {
      userId: decoded.userId,
      id: decoded.userId,
      role: decoded.role,
    }
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send(
        errorResponse('TOKEN_EXPIRED', 'Token has expired')
      )
    }

    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send(
        errorResponse('INVALID_TOKEN', 'Invalid token')
      )
    }

    return reply.code(401).send(
      errorResponse('UNAUTHORIZED', 'Authentication failed')
    )
  }
}

/**
 * Optional authentication - sets request.user if valid token present,
 * but does NOT fail if no token or invalid token (for public routes that can show extra info when logged in)
 */
export const optionalAuthenticate = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return
    }

    const decoded = request.server.jwt.verify<{
      userId: string
      role: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'
    }>(token)

    ;(request as AuthenticatedRequest).user = {
      userId: decoded.userId,
      id: decoded.userId,
      role: decoded.role,
    }
  } catch {
    // Silently ignore - request continues without user
  }
}

/**
 * Role-based middleware factory
 * Checks if user role is in allowed roles
 */
export const requireRole = (...allowedRoles: string[]) => {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send(
        errorResponse('UNAUTHORIZED', 'Not authenticated')
      )
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send(
        errorResponse('FORBIDDEN', 'Insufficient permissions')
      )
    }
  }
}

/**
 * Specific role middlewares
 */
export const requireAdmin = requireRole('ADMIN')
export const requireBusiness = requireRole('BUSINESS', 'ADMIN')
export const requireWaveLeader = requireRole('WAVELEADER', 'ADMIN')

