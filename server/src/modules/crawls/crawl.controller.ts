import { FastifyRequest, FastifyReply } from 'fastify'
import { successResponse, errorResponse } from '../../utils/response'
import type { AuthenticatedRequest } from '../../middleware/authenticate'
import * as crawlService from './crawl.service'
import { RegistrationError } from './crawl.registration.service'

function parseListQuery(q: Record<string, string | undefined>): crawlService.ListCrawlsQuery {
  return {
    search: q.search,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    sort: (q.sort as crawlService.ListCrawlsQuery['sort']) || undefined,
    page: q.page != null ? parseInt(q.page, 10) : undefined,
    limit: q.limit != null ? parseInt(q.limit, 10) : undefined,
  }
}

export const getCrawls = async (
  request: FastifyRequest<{ Querystring: Record<string, string | undefined> }>,
  reply: FastifyReply
) => {
  try {
    const filters = parseListQuery(request.query)
    const crawls = await crawlService.getCrawls(filters)
    return reply.send(successResponse(crawls))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list crawls'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const getNearbyCrawls = async (
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
    const crawls = await crawlService.getNearbyCrawls(lat, lng, radius, limit)
    return reply.send(successResponse(crawls))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load nearby crawls'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const getCrawlDetails = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const crawl = await crawlService.getCrawlById(id)
    if (!crawl) {
      return reply.code(404).send(errorResponse('NOT_FOUND', 'Crawl not found'))
    }
    return reply.send(successResponse(crawl))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load crawl'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const getMyRegistration = async (
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const userId = request.user.userId
    const registration = await crawlService.getRegistration(id, userId)
    return reply.send(successResponse(registration))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load registration'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

function registrationStatus(e: RegistrationError) {
  if (e.code === 'SOLD_OUT' || e.code === 'ALREADY_REGISTERED') return 409
  if (e.code === 'NOT_FOUND' || e.code === 'NOT_REGISTERED') return 404
  return 400
}

export const registerForCrawl = async (
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const userId = request.user.userId
    const registration = await crawlService.registerForCrawl(id, userId)
    return reply.code(201).send(successResponse(registration))
  } catch (error: unknown) {
    if (error instanceof RegistrationError) {
      return reply.code(registrationStatus(error)).send(errorResponse(error.code, error.message))
    }
    const message = error instanceof Error ? error.message : 'Registration failed'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const cancelRegistration = async (
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params
    const userId = request.user.userId
    await crawlService.cancelRegistration(id, userId)
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
