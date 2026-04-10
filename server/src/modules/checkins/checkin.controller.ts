import { FastifyReply } from 'fastify'
import { checkInService } from './checkin.service'
import { errorResponse, successResponse } from '../../utils/response'
import { AuthenticatedRequest } from '../../middleware/authenticate'

export const checkInController = {
  /**
   * Check if user can check in
   * GET /api/checkins/can-check-in/:businessId
   */
  canCheckIn: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { businessId } = request.params as { businessId: string }
      const { latitude, longitude } = request.query as {
        latitude?: string
        longitude?: string
      }

      const userLat = latitude ? Number(latitude) : undefined
      const userLng = longitude ? Number(longitude) : undefined

      const result = await checkInService.canCheckIn(
        request.user.id,
        businessId,
        userLat,
        userLng
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
   * Perform check-in
   * POST /api/checkins/:businessId
   */
  checkIn: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { businessId } = request.params as { businessId: string }
      const { latitude, longitude, method } = request.body as {
        latitude?: number
        longitude?: number
        method?: 'MANUAL' | 'QR_CODE' | 'GEOFENCE'
      }

      const result = await checkInService.checkIn(
        request.user.id,
        businessId,
        method || 'GEOFENCE',
        latitude,
        longitude
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
   * Get user's check-in history
   * GET /api/checkins
   */
  getHistory: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { limit } = request.query as { limit?: string }
      const checkIns = await checkInService.getCheckInHistory(
        request.user.id,
        limit ? Number(limit) : 100
      )

      return reply.send(successResponse(checkIns))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * Get user's unique check-in locations
   * GET /api/checkins/locations
   */
  getLocations: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const locations = await checkInService.getCheckInLocations(request.user.id)
      return reply.send(successResponse(locations))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },
}

