import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as businessService from './business.service'
import * as businessSchema from './business.schema'
import * as businessEventsSchema from './business-events.schema'
import { successResponse, errorResponse } from '../../utils/response'
import { NotFoundError, BadRequestError } from '../../utils/errors'

const handleValidationError = (reply: FastifyReply, error: unknown) => {
  if (!(error instanceof z.ZodError)) {
    throw error
  }

  return reply.code(400).send({
    success: false,
    message: 'Validation failed',
    errors: error.errors.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  })
}

// GET /api/business/dashboard
export const getDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).userId
  const dashboard = await businessService.getDashboardData(userId)
  return reply.send(successResponse(dashboard))
}

// GET /api/business/stats
export const getStats = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).userId
  const stats = await businessService.getBusinessStats(userId)
  return reply.send(successResponse(stats))
}

// GET /api/business/revenue?period=30d
export const getRevenue = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { period } = businessSchema.revenueQuerySchema.parse(request.query)
    const revenue = await businessService.getRevenueData(userId, period)
    return reply.send(successResponse(revenue))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/analytics
export const getAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const query = businessSchema.analyticsQuerySchema.parse(request.query)
    const analytics = await businessService.getAnalytics(userId, query)
    return reply.send(successResponse(analytics))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/analytics/peak-hours
export const getPeakHours = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { period } = businessSchema.periodQuerySchema.parse(request.query)
    const peakHours = await businessService.getPeakHours(userId, period)
    return reply.send(successResponse(peakHours))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/analytics/top-customers
export const getTopCustomers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { limit } = businessSchema.limitQuerySchema.parse(request.query)
    const customers = await businessService.getTopCustomers(userId, limit)
    return reply.send(successResponse(customers))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/analytics/promotions-performance
export const getPromotionsPerformance = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).userId
  const rows = await businessService.getPromotionsPerformance(userId)
  return reply.send(successResponse(rows))
}

// GET /api/business/analytics/customer-locations
export const getCustomerLocations = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { period } = businessSchema.periodQuerySchema.parse(request.query)
    const locations = await businessService.getCustomerLocations(userId, period)
    return reply.send(successResponse(locations))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/checkins/recent
export const getRecentCheckIns = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { limit } = businessSchema.limitQuerySchema.parse(request.query)
    const checkIns = await businessService.getRecentCheckIns(userId, limit)
    return reply.send(successResponse(checkIns))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/location
export const getLocation = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).userId
  const location = await businessService.getBusinessLocation(userId)
  return reply.send(successResponse(location))
}

// PATCH /api/business/location
export const updateLocation = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const validated = businessSchema.updateLocationSchema.parse(request.body)
    const updated = await businessService.updateBusinessLocation(userId, validated)
    return reply.send(successResponse(updated))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/competitors
export const getCompetitors = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { radius } = businessSchema.competitorsQuerySchema.parse(request.query)
    const competitors = await businessService.getCompetitors(userId, radius)
    return reply.send(successResponse(competitors))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/waveleaders
export const getNearbyWaveLeaders = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { lat, lng, radius } = businessSchema.waveleadersQuerySchema.parse(request.query)
    const waveLeaders = await businessService.getNearbyWaveLeaders(userId, lat, lng, radius)
    return reply.send(successResponse(waveLeaders))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/ads
export const getAdvertisements = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).userId
  const { status } = request.query as { status?: string }
  const ads = await businessService.getAdvertisements(userId, status)
  return reply.send(successResponse(ads))
}

// POST /api/business/ads
export const createAdvertisement = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const adData = businessSchema.createAdvertisementSchema.parse(request.body)
    const ad = await businessService.createAdvertisement(userId, adData)
    return reply.send(successResponse(ad))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// GET /api/business/ads/estimate
export const estimateAdReach = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { radius, demographics } = businessSchema.adEstimateQuerySchema.parse(request.query)
    const estimate = await businessService.estimateAdReach(userId, radius, demographics)
    return reply.send(successResponse(estimate))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// PATCH /api/business/ads/:id
export const updateAdvertisement = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { id } = businessSchema.advertisementIdParamsSchema.parse(request.params)
    const updates = businessSchema.updateAdvertisementSchema.parse(request.body)
    const ad = await businessService.updateAdvertisement(userId, id, updates)
    return reply.send(successResponse(ad))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// DELETE /api/business/ads/:id
export const deleteAdvertisement = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { id } = businessSchema.advertisementIdParamsSchema.parse(request.params)
    await businessService.deleteAdvertisement(userId, id)
    return reply.send(successResponse({ message: 'Advertisement deleted' }))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// POST /api/business/ads/:id/pause
export const pauseAdvertisement = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { id } = businessSchema.advertisementIdParamsSchema.parse(request.params)
    const ad = await businessService.pauseAdvertisement(userId, id)
    return reply.send(successResponse(ad))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

// POST /api/business/ads/:id/resume
export const resumeAdvertisement = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { id } = businessSchema.advertisementIdParamsSchema.parse(request.params)
    const ad = await businessService.resumeAdvertisement(userId, id)
    return reply.send(successResponse(ad))
  } catch (error) {
    return handleValidationError(reply, error)
  }
}

const eventValidation = (reply: FastifyReply, error: unknown) => {
  if (!(error instanceof z.ZodError)) return false
  reply.code(400).send({
    success: false,
    message: 'Validation failed',
    errors: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
  })
  return true
}

// ——— Business event management (/api/business/events) ———

export const getBusinessEvents = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const q = businessEventsSchema.listBusinessEventsQuerySchema.parse(request.query)
    const { items } = await businessService.getBusinessEvents(userId, q.tab)
    return reply.send(successResponse({ items }))
  } catch (e: unknown) {
    if (eventValidation(reply, e)) return
    throw e
  }
}

export const createEvent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const body = businessEventsSchema.createBusinessEventSchema.parse(request.body)
    const data = await businessService.createEvent(userId, body)
    return reply.code(201).send(successResponse(data))
  } catch (e: unknown) {
    if (eventValidation(reply, e)) return
    throw e
  }
}

export const getEventStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const data = await businessService.getEventStats(userId)
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const getBusinessEventDetails = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const data = await businessService.getBusinessEventDetails(userId, request.params.id)
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const updateEvent = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const body = businessEventsSchema.updateBusinessEventSchema.parse(request.body)
    const data = await businessService.updateEvent(userId, request.params.id, body)
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (eventValidation(reply, e)) return
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const deleteEvent = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    await businessService.deleteEvent(userId, request.params.id)
    return reply.send(successResponse({ message: 'Event deleted', deleted: true }))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    if (e instanceof BadRequestError) {
      return reply.code(400).send(errorResponse('BAD_REQUEST', e.message))
    }
    throw e
  }
}

export const publishEvent = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const data = await businessService.publishEvent(userId, request.params.id)
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const cancelEvent = async (
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const body = businessEventsSchema.cancelEventBodySchema.parse(
      request.body && typeof request.body === 'object' ? request.body : {}
    )
    const data = await businessService.cancelEvent(userId, request.params.id, body.reason)
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (eventValidation(reply, e)) return
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const duplicateEvent = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const data = await businessService.duplicateEvent(userId, request.params.id)
    return reply.code(201).send(successResponse(data))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const getEventAttendees = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const items = await businessService.getEventAttendees(userId, request.params.id)
    return reply.send(successResponse({ items }))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const checkInAttendee = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const body = businessEventsSchema.businessCheckInBodySchema.parse(request.body)
    const eventId = request.params.id
    const data = await businessService.checkInAttendee(
      userId,
      eventId,
      body.attendeeId,
      body.qrCode,
      body.method
    )
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (eventValidation(reply, e)) return
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    if (e instanceof BadRequestError) {
      return reply.code(400).send(errorResponse('BAD_REQUEST', e.message))
    }
    throw e
  }
}

export const checkInScan = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const body = businessEventsSchema.scanCheckInBodySchema.parse(request.body)
    const data = await businessService.checkInScan(userId, request.params.id, body.scan)
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (eventValidation(reply, e)) return
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const removeAttendee = async (
  request: FastifyRequest<{ Params: { id: string; attendeeId: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const data = await businessService.removeAttendee(
      userId,
      request.params.id,
      request.params.attendeeId
    )
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}

export const getEventAnalytics = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { userId: string }).userId
    const data = await businessService.getEventAnalytics(userId, request.params.id)
    return reply.send(successResponse(data))
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    }
    throw e
  }
}
