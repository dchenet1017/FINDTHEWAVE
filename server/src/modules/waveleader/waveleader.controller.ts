import { FastifyRequest, FastifyReply } from 'fastify'
import { waveleaderService } from './waveleader.service'
import { successResponse } from '../../utils/response'
import { AuthenticatedRequest } from '../../middleware/authenticate'
import { waveLeaderRegistrationSchema } from './waveleader.schema'

export const waveleaderController = {
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const userId = authRequest.user.userId

    const parsed = waveLeaderRegistrationSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Validation failed',
        },
      })
    }

    const data = parsed.data

    const result = await waveleaderService.register(userId, data)

    return reply.code(201).send(successResponse(result))
  },

  getDashboard: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const result = await waveleaderService.getDashboard(authRequest.user.userId)
    return reply.send(successResponse(result))
  },

  getStats: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const result = await waveleaderService.getStats(authRequest.user.userId)
    return reply.send(successResponse(result))
  },

  updateAvailability: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const body = request.body as { isAvailable?: boolean }
    const isAvailable = body?.isAvailable ?? false
    const result = await waveleaderService.updateAvailability(
      authRequest.user.userId,
      isAvailable
    )
    return reply.send(successResponse(result))
  },

  getMe: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const result = await waveleaderService.getMe(authRequest.user.userId)
    return reply.send(successResponse(result))
  },

  updateMe: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const body = request.body as Record<string, unknown>
    const result = await waveleaderService.updateMe(
      authRequest.user.userId,
      body
    )
    return reply.send(successResponse(result))
  },

  getPublicProfile: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await waveleaderService.getPublicProfile(id)
    return reply.send(successResponse(result))
  },

  getReviews: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const query = request.query as { page?: string; limit?: string }
    const page = parseInt(query.page ?? '1', 10)
    const limit = parseInt(query.limit ?? '10', 10)
    const result = await waveleaderService.getReviews(id, page, limit)
    return reply.send(successResponse(result))
  },

  getServiceArea: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const result = await waveleaderService.getServiceArea(authRequest.user.userId)
    return reply.send(successResponse(result))
  },

  updateServiceArea: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const body = request.body as {
      latitude?: number
      longitude?: number
      radius?: number
    }
    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude required' },
      })
    }
    const result = await waveleaderService.updateServiceArea(
      authRequest.user.userId,
      {
        latitude: body.latitude,
        longitude: body.longitude,
        radius: body.radius,
      }
    )
    return reply.send(successResponse(result))
  },

  getOpportunities: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const result = await waveleaderService.getOpportunities(
      authRequest.user.userId
    )
    return reply.send(successResponse(result))
  },

  getBookings: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const query = request.query as { status?: string }
    const result = await waveleaderService.getBookings(
      authRequest.user.userId,
      query.status
    )
    return reply.send(successResponse(result))
  },

  getBookingsStats: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const result = await waveleaderService.getBookingsStats(authRequest.user.userId)
    return reply.send(successResponse(result))
  },

  getBookingLocations: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const query = request.query as { period?: string }
    const result = await waveleaderService.getBookingLocations(
      authRequest.user.userId,
      query.period ?? 'week'
    )
    return reply.send(successResponse(result))
  },

  getEarningsHeatmap: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const query = request.query as { period?: string }
    const result = await waveleaderService.getEarningsHeatmap(
      authRequest.user.userId,
      query.period ?? 'week'
    )
    return reply.send(successResponse(result))
  },

  getWaveLeaders: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>
    const result = await waveleaderService.listWaveLeaders(query)
    return reply.send(successResponse(result))
  },

  getNearbyWaveLeaders: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { lat: string; lng: string; radius?: string; limit?: string }
    const lat = parseFloat(query.lat)
    const lng = parseFloat(query.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'lat and lng required' },
      })
    }
    const radius = query.radius ? parseFloat(query.radius) : 25
    const limit = query.limit ? parseInt(query.limit, 10) : 20
    const result = await waveleaderService.getNearbyWaveLeaders(lat, lng, radius, limit)
    return reply.send(successResponse(result))
  },

  searchWaveLeaders: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { q?: string; limit?: string }
    const limit = query.limit ? parseInt(query.limit, 10) : 20
    const result = await waveleaderService.searchWaveLeaders(query.q ?? '', limit)
    return reply.send(successResponse(result))
  },

  getAvailability: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const query = request.query as { date?: string; month?: string }
    const result = await waveleaderService.getAvailability(id, query.date, query.month)
    return reply.send(successResponse(result))
  },

  getSlots: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const query = request.query as { date?: string }
    if (!query.date) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'date required (YYYY-MM-DD)' },
      })
    }
    const result = await waveleaderService.getSlotsForDate(id, query.date)
    return reply.send(successResponse(result))
  },

  uploadPortfolioImage: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const body = request.body as { imageUrl: string }
    if (!body?.imageUrl || typeof body.imageUrl !== 'string') {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'imageUrl required' },
      })
    }
    const result = await waveleaderService.addPortfolioImage(
      authRequest.user.userId,
      body.imageUrl
    )
    return reply.send(successResponse(result))
  },

  deletePortfolioImage: async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest
    const { imageId } = request.params as { imageId: string }
    const result = await waveleaderService.removePortfolioImage(
      authRequest.user.userId,
      imageId
    )
    return reply.send(successResponse(result))
  },
}
