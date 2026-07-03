import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { successResponse, errorResponse } from '../../utils/response'
import { NotFoundError, BadRequestError } from '../../utils/errors'
import * as businessCrawlsService from './business-crawls.service'
import {
  createBusinessCrawlSchema,
  updateBusinessCrawlSchema,
  businessCrawlCheckInBodySchema,
} from './business-crawls.schema'

const validation = (reply: FastifyReply, error: unknown) => {
  if (!(error instanceof z.ZodError)) return false
  reply.code(400).send({
    success: false,
    message: 'Validation failed',
    errors: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
  })
  return true
}

const handleErrors = (reply: FastifyReply, e: unknown) => {
  if (validation(reply, e)) return true
  if (e instanceof NotFoundError) {
    reply.code(404).send(errorResponse('NOT_FOUND', e.message))
    return true
  }
  if (e instanceof BadRequestError) {
    reply.code(400).send(errorResponse('BAD_REQUEST', e.message))
    return true
  }
  return false
}

function userId(request: FastifyRequest) {
  return (request.user as { userId: string }).userId
}

export const getStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await businessCrawlsService.getBusinessCrawlStats(userId(request))
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const listCrawls = async (
  request: FastifyRequest<{ Querystring: { tab?: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await businessCrawlsService.listBusinessCrawls(userId(request), request.query.tab)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const createCrawl = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = createBusinessCrawlSchema.parse(request.body)
    const data = await businessCrawlsService.createBusinessCrawl(userId(request), body)
    return reply.code(201).send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const getCrawl = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await businessCrawlsService.getBusinessCrawl(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const updateCrawl = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const body = updateBusinessCrawlSchema.parse(request.body)
    const data = await businessCrawlsService.updateBusinessCrawl(userId(request), request.params.id, body)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const deleteCrawl = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await businessCrawlsService.deleteBusinessCrawl(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const publishCrawl = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await businessCrawlsService.publishBusinessCrawl(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const cancelCrawl = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await businessCrawlsService.cancelBusinessCrawl(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const duplicateCrawl = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await businessCrawlsService.duplicateBusinessCrawl(userId(request), request.params.id)
    return reply.code(201).send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const getAttendees = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await businessCrawlsService.listCrawlAttendees(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const getMyStops = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await businessCrawlsService.listMyStops(userId(request))
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const checkInAtStop = async (
  request: FastifyRequest<{ Params: { id: string; stopId: string } }>,
  reply: FastifyReply
) => {
  try {
    const body = businessCrawlCheckInBodySchema.parse(request.body)
    const data = body.attendeeId
      ? await businessCrawlsService.checkInAtStop(
          userId(request),
          request.params.id,
          request.params.stopId,
          body.attendeeId,
          body.method ?? 'MANUAL'
        )
      : await businessCrawlsService.checkInFromScan(
          userId(request),
          request.params.id,
          request.params.stopId,
          body.qrCode!
        )
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}
