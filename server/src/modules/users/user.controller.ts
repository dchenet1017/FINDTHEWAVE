import { FastifyReply } from 'fastify'
import { userService } from './user.service'
import { errorResponse, successResponse } from '../../utils/response'
import { AuthenticatedRequest } from '../../middleware/authenticate'

export const userController = {
  /**
   * GET /api/users/me/profile
   */
  getProfile: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const profile = await userService.getProfile(request.user.id)
      return reply.send(successResponse(profile))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * PATCH /api/users/me/profile
   */
  updateProfile: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const data = (request as any).validatedBody
      const profile = await userService.updateProfile(request.user.id, data)
      return reply.send(successResponse(profile))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * POST /api/users/me/avatar
   */
  uploadAvatar: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const data = await request.file()
      if (!data) {
        return reply.code(400).send(errorResponse('BAD_REQUEST', 'No file uploaded'))
      }

      // Validate file type
      if (!data.mimetype.startsWith('image/')) {
        return reply.code(400).send(errorResponse('BAD_REQUEST', 'File must be an image'))
      }

      // Validate file size (5MB)
      if (data.file.bytesRead > 5 * 1024 * 1024) {
        return reply.code(400).send(errorResponse('BAD_REQUEST', 'File size must be less than 5MB'))
      }

      // Read file buffer
      const chunks: Buffer[] = []
      for await (const chunk of data.file) {
        chunks.push(chunk)
      }
      const fileBuffer = Buffer.concat(chunks)

      // Upload avatar
      const result = await userService.uploadAvatar(
        request.user.id,
        fileBuffer,
        data.filename
      )

      return reply.send(successResponse(result))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * PATCH /api/users/me/settings
   */
  updateSettings: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const data = (request as any).validatedBody
      const settings = await userService.updateSettings(request.user.id, data)
      return reply.send(successResponse(settings))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * DELETE /api/users/me
   */
  deleteAccount: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      await userService.deleteAccount(request.user.id)
      return reply.send(successResponse({ message: 'Account deleted successfully' }))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/stats
   */
  getStats: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const stats = await userService.getUserStats(request.user.id)
      return reply.send(successResponse(stats))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/activity
   */
  getActivity: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { limit } = request.query as { limit?: string }
      const activity = await userService.getActivity(request.user.id, limit ? Number(limit) : 5)
      return reply.send(successResponse(activity))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/bookings
   */
  getBookings: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { status, limit, sort, search } = request.query as {
        status?: string
        limit?: string
        sort?: string
        search?: string
      }
      const bookings = await userService.getBookings(
        request.user.userId,
        status,
        limit ? Number(limit) : undefined,
        sort,
        search
      )
      return reply.send(successResponse(bookings))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/events?status=upcoming|past|cancelled
   */
  getMyEvents: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { status } = request.query as { status?: string }
      const allowed = ['upcoming', 'past', 'cancelled'] as const
      const tab =
        status && (allowed as readonly string[]).includes(status)
          ? (status as (typeof allowed)[number])
          : undefined
      const events = await userService.getMyEvents(request.user.userId, tab)
      return reply.send(successResponse(events))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/passport
   */
  getPassport: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const passport = await userService.getPassportData(request.user.id)
      return reply.send(successResponse(passport))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/checkins
   */
  getCheckInHistory: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { checkInService } = await import('../checkins/checkin.service')
      const { limit } = request.query as { limit?: string }
      const checkIns = await checkInService.getCheckInHistory(
        request.user.id,
        limit ? Number(limit) : 100
      )
      return reply.send(successResponse(checkIns))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/checkins/locations
   */
  getCheckInLocations: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { checkInService } = await import('../checkins/checkin.service')
      const locations = await checkInService.getCheckInLocations(request.user.id)
      return reply.send(successResponse(locations))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/communities
   */
  getMyCommunities: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const communities = await userService.getMyCommunities(request.user.userId)
      return reply.send(successResponse(communities))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/favorites
   */
  getFavorites: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const favorites = await userService.getFavorites(request.user.id)
      return reply.send(successResponse(favorites))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * POST /api/users/me/favorites/:businessId
   */
  addFavorite: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { businessId } = request.params as { businessId: string }
      const result = await userService.addFavorite(request.user.id, businessId)
      return reply.send(successResponse(result))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * DELETE /api/users/me/favorites/:businessId
   */
  removeFavorite: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { businessId } = request.params as { businessId: string }
      const result = await userService.removeFavorite(request.user.id, businessId)
      return reply.send(successResponse(result))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/users/me/settings
   */
  getSettings: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const settings = await userService.getSettings(request.user.id)
      return reply.send(successResponse(settings))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },
}

