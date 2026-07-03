import { FastifyRequest, FastifyReply } from 'fastify'
import { successResponse, errorResponse } from '../../utils/response'
import { BadRequestError } from '../../utils/errors'
import * as goOutService from './go-out.service'

function userId(request: FastifyRequest) {
  return (request.user as { userId: string }).userId
}

const handleErrors = (reply: FastifyReply, e: unknown) => {
  if (e instanceof BadRequestError) {
    reply.code(400).send(errorResponse('BAD_REQUEST', e.message))
    return true
  }
  return false
}

export const activate = async (
  request: FastifyRequest<{ Body: { latitude?: number; longitude?: number; durationMinutes?: number } }>,
  reply: FastifyReply
) => {
  try {
    const { latitude, longitude, durationMinutes } = request.body ?? {}
    if (latitude == null || longitude == null) {
      return reply.code(400).send(errorResponse('VALIDATION_ERROR', 'latitude and longitude are required'))
    }
    const data = await goOutService.activate(userId(request), latitude, longitude, durationMinutes ?? 120)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const deactivate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await goOutService.deactivate(userId(request))
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const getStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await goOutService.getStatus(userId(request))
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const getNearby = async (
  request: FastifyRequest<{ Querystring: { radius?: string; lat?: string; lng?: string } }>,
  reply: FastifyReply
) => {
  try {
    const radius = request.query.radius != null ? parseFloat(request.query.radius) : undefined
    const lat = request.query.lat != null ? parseFloat(request.query.lat) : undefined
    const lng = request.query.lng != null ? parseFloat(request.query.lng) : undefined
    const data = await goOutService.getNearby(userId(request), radius, lat, lng)
    return reply.send(successResponse({ items: data }))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}
