import { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './waveleaders-public.service'
import { successResponse } from '../../utils/response'
import { waveleaderService } from '../waveleader/waveleader.service'

export async function list(
  request: FastifyRequest<{
    Querystring: {
      page?: string
      limit?: string
      specialty?: string
      minRate?: string
      maxRate?: string
      minRating?: string
      availableNow?: string
      verifiedOnly?: string
      lat?: string
      lng?: string
      radiusMiles?: string
      sortBy?: string
      sortOrder?: string
      search?: string
    }
  }>,
  reply: FastifyReply
) {
  const q = request.query
  const filters = {
    page: q.page ? parseInt(q.page, 10) : undefined,
    limit: q.limit ? parseInt(q.limit, 10) : undefined,
    specialty: q.specialty,
    minRate: q.minRate ? parseFloat(q.minRate) : undefined,
    maxRate: q.maxRate ? parseFloat(q.maxRate) : undefined,
    minRating: q.minRating ? parseFloat(q.minRating) : undefined,
    availableNow: q.availableNow === 'true',
    verifiedOnly: q.verifiedOnly === 'true',
    lat: q.lat ? parseFloat(q.lat) : undefined,
    lng: q.lng ? parseFloat(q.lng) : undefined,
    radiusMiles: q.radiusMiles ? parseFloat(q.radiusMiles) : undefined,
    sortBy: (q.sortBy as any) || undefined,
    sortOrder: (q.sortOrder as any) || undefined,
    search: q.search,
  }
  const result = await service.listWaveLeaders(filters)
  return reply.send(successResponse(result))
}

export async function nearby(
  request: FastifyRequest<{
    Querystring: { lat: string; lng: string; radius?: string; limit?: string }
  }>,
  reply: FastifyReply
) {
  const { lat, lng, radius, limit } = request.query
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return reply.code(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'lat and lng required' },
    })
  }
  const radiusMiles = radius ? parseFloat(radius) : 25
  const limitNum = limit ? parseInt(limit, 10) : 20
  const result = await service.getNearbyWaveLeaders(
    latNum,
    lngNum,
    radiusMiles,
    limitNum
  )
  return reply.send(successResponse(result))
}

export async function search(
  request: FastifyRequest<{ Querystring: { q?: string; limit?: string } }>,
  reply: FastifyReply
) {
  const q = request.query.q || ''
  const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20
  const result = await service.searchWaveLeaders(q, limit)
  return reply.send(successResponse(result))
}

export async function getAvailability(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params
  const result = await service.getAvailability(id)
  return reply.send(successResponse(result))
}

export async function getReviews(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params
  const page = request.query.page ? parseInt(request.query.page, 10) : 1
  const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10
  const result = await waveleaderService.getReviews(id, page, limit)
  return reply.send(successResponse(result))
}

export async function getReviewStats(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params
  const result = await waveleaderService.getReviewStats(id)
  return reply.send(successResponse(result))
}
