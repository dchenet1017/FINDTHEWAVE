import { FastifyReply, FastifyRequest } from 'fastify'
import { businessService } from './business.service'
import { errorResponse, successResponse } from '../../utils/response'
import { AuthenticatedRequest } from '../../middleware/authenticate'
import { NotFoundError, ForbiddenError } from '../../utils/errors'

export const businessController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.query as any
      const data = await businessService.getBusinesses({
        page: params.page ? Number(params.page) : 1,
        limit: params.limit ? Number(params.limit) : 20,
        search: params.search,
        type: params.type,
        status: params.status,
        city: params.city,
        state: params.state,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })
      return reply.send(successResponse(data))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  nearby: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = (request as any).validatedQuery
      // Support both lat/lng and latitude/longitude
      const lat = query.lat ?? query.latitude
      const lng = query.lng ?? query.longitude
      // Support both radius and radiusMiles
      const radius = query.radius ?? query.radiusMiles ?? 5
      const { types, limit } = query
      
      if (!lat || !lng) {
        return reply.code(400).send(errorResponse('BAD_REQUEST', 'Latitude and longitude are required'))
      }
      
      const data = await businessService.getNearbyBusinesses({
        lat: Number(lat),
        lng: Number(lng),
        radius: Number(radius),
        limit,
        types: types ? (types as string).split(',') as any : undefined,
      })
      return reply.send(successResponse(data))
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  search: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { q, lat, lng } = request.query as any
      const data = await businessService.searchBusinesses(q, lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined)
      return reply.send(successResponse(data))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  map: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const bounds = (request as any).validatedQuery
      const data = await businessService.getBusinessesInBounds({
        north: Number(bounds.north),
        south: Number(bounds.south),
        east: Number(bounds.east),
        west: Number(bounds.west),
      })
      return reply.send(successResponse(data))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  typeCounts: async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await businessService.getBusinessTypeCounts()
      return reply.send(successResponse(data))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any
      const business = await businessService.getBusinessById(id)
      if (!business) {
        return reply.code(404).send(errorResponse('NOT_FOUND', 'Business not found'))
      }
      return reply.send(successResponse(business))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  getMyBusiness: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const business = await businessService.getBusinessByUserId(request.user.userId)
      if (!business) {
        return reply.code(404).send(errorResponse('NOT_FOUND', 'Business not found'))
      }
      return reply.send(successResponse(business))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  create: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const data = (request as any).validatedBody
      const business = await businessService.createBusiness(request.user.userId, data)
      return reply.code(201).send(successResponse(business))
    } catch (error: any) {
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  update: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any
      const data = (request as any).validatedBody
      const business = await businessService.updateBusiness(id, request.user.userId, request.user.role, data)
      return reply.send(successResponse(business))
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send(errorResponse('NOT_FOUND', error.message))
      }
      if (error instanceof ForbiddenError) {
        return reply.code(403).send(errorResponse('FORBIDDEN', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  remove: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any
      await businessService.deleteBusiness(id, request.user.userId, request.user.role)
      return reply.send(successResponse({ deleted: true }))
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send(errorResponse('NOT_FOUND', error.message))
      }
      if (error instanceof ForbiddenError) {
        return reply.code(403).send(errorResponse('FORBIDDEN', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  createPromotion: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any
      const data = (request as any).validatedBody
      const promotion = await businessService.createPromotion(id, request.user.userId, request.user.role, data)
      return reply.code(201).send(successResponse(promotion))
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send(errorResponse('NOT_FOUND', error.message))
      }
      if (error instanceof ForbiddenError) {
        return reply.code(403).send(errorResponse('FORBIDDEN', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },
}

