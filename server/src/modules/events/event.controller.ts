import { FastifyRequest, FastifyReply } from 'fastify'
import type { EventCategory } from '@prisma/client'
import { successResponse, errorResponse } from '../../utils/response'
import type { AuthenticatedRequest } from '../../middleware/authenticate'
import * as eventService from './event.service'
import { RegistrationError } from './event.registration.service'

function parseListQuery(q: Record<string, string | undefined>): eventService.ListEventsQuery {
  const cat = q.category?.trim()
  const category =
    cat && cat !== 'ALL' && cat !== 'all' ? (cat as EventCategory) : undefined
  return {
    search: q.search,
    category,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    startDate: q.startDate,
    endDate: q.endDate,
    freeOnly: q.freeOnly === 'true' || q.isFree === 'true',
    hasWaveLeader: q.hasWaveLeader === 'true',
    virtualOnly: q.virtualOnly === 'true' || q.isVirtual === 'true',
    minPrice: q.minPrice != null ? parseFloat(q.minPrice) : undefined,
    maxPrice: q.maxPrice != null ? parseFloat(q.maxPrice) : undefined,
    lat: q.lat != null ? parseFloat(q.lat) : undefined,
    lng: q.lng != null ? parseFloat(q.lng) : undefined,
    radius: q.radius != null ? parseFloat(q.radius) : undefined,
    minSpotsLeft: q.minSpotsLeft != null ? parseInt(q.minSpotsLeft, 10) : undefined,
    sort: (q.sort as eventService.ListEventsQuery['sort']) || undefined,
    page: q.page != null ? parseInt(q.page, 10) : undefined,
    limit: q.limit != null ? parseInt(q.limit, 10) : undefined,
    offset: q.offset != null ? parseInt(q.offset, 10) : undefined,
  }
}

export const getEvents = async (
  request: FastifyRequest<{ Querystring: Record<string, string | undefined> }>,
  reply: FastifyReply
) => {
  try {
    const filters = parseListQuery(request.query)
    const events = await eventService.getEvents(filters)
    return reply.send(successResponse(events))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list events'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const list = getEvents

export const getFeaturedEvents = async (
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply
) => {
  try {
    const limit = request.query.limit != null ? parseInt(request.query.limit, 10) : 12
    const events = await eventService.getFeaturedEvents(limit)
    return reply.send(successResponse(events))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load featured events'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const featured = getFeaturedEvents

export const getNearbyEvents = async (
  request: FastifyRequest<{ Querystring: { lat?: string; lng?: string; radius?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  try {
    const lat = request.query.lat != null ? parseFloat(request.query.lat) : NaN
    const lng = request.query.lng != null ? parseFloat(request.query.lng) : NaN
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return reply.code(400).send(errorResponse('VALIDATION_ERROR', 'lat and lng are required'))
    }
    const radius = request.query.radius != null ? parseFloat(request.query.radius) : 10
    const limit = request.query.limit != null ? parseInt(request.query.limit, 10) : 40
    const events = await eventService.getNearbyEvents(lat, lng, radius, limit)
    return reply.send(successResponse(events))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load nearby events'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const nearby = getNearbyEvents

export const getEventDetails = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const event = await eventService.getEventById(id)
    if (!event) {
      return reply.code(404).send(errorResponse('NOT_FOUND', 'Event not found'))
    }
    return reply.send(successResponse(event))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load event'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const getById = getEventDetails

export const getSimilarEvents = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const items = await eventService.getSimilarEvents(id, 4)
    return reply.send(successResponse({ items }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load similar events'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const getSimilar = getSimilarEvents

export const getMyRegistration = async (
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const userId = request.user.userId
    const registration = await eventService.getRegistration(id, userId)
    return reply.send(successResponse(registration))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load registration'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

function registrationStatus(e: RegistrationError) {
  if (e.code === 'SOLD_OUT' || e.code === 'ALREADY_REGISTERED') return 409
  if (e.code === 'NOT_FOUND' || e.code === 'NOT_REGISTERED') return 404
  if (e.code === 'DEADLINE_PASSED' || e.code === 'SPOTS_AVAILABLE') return 400
  return 400
}

export const registerForEvent = async (
  request: AuthenticatedRequest &
    FastifyRequest<{ Params: { id: string }; Body: { tickets?: number; waitlist?: boolean } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const userId = request.user.userId
    const tickets = request.body?.tickets ?? 1
    const waitlist = request.body?.waitlist === true

    const registration = await eventService.registerForEvent(id, userId, tickets, { waitlist })
    return reply.code(201).send(successResponse(registration))
  } catch (error: unknown) {
    if (error instanceof RegistrationError) {
      return reply
        .code(registrationStatus(error))
        .send(errorResponse(error.code, error.message))
    }
    const message = error instanceof Error ? error.message : 'Registration failed'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const register = registerForEvent

export const cancelRegistration = async (
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const userId = request.user.userId
    await eventService.cancelRegistration(id, userId)
    return reply.send(successResponse({ message: 'Registration cancelled', cancelled: true }))
  } catch (error: unknown) {
    if (error instanceof RegistrationError) {
      const code = error.code === 'NOT_REGISTERED' ? 404 : 400
      return reply.code(code).send(errorResponse(error.code, error.message))
    }
    const message = error instanceof Error ? error.message : 'Failed to cancel'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const incrementViews = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    await eventService.incrementEventViews(id)
    return reply.send(successResponse({ success: true }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record view'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}
