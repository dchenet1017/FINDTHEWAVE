import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { successResponse, errorResponse } from '../../../utils/response'
import { NotFoundError, BadRequestError } from '../../../utils/errors'
import * as adminCrawlsService from './admin-crawls.service'
import {
  createBusinessCrawlSchema,
  updateBusinessCrawlSchema,
} from '../../business/business-crawls.schema'

const handleErrors = (reply: FastifyReply, e: unknown) => {
  if (e instanceof z.ZodError) {
    reply.code(400).send({
      success: false,
      message: 'Validation failed',
      errors: e.errors.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    })
    return true
  }
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

export const getCrawls = async (
  request: FastifyRequest<{ Querystring: { status?: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await adminCrawlsService.listAllCrawls(request.query.status)
    return reply.send(successResponse(data))
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
    const data = await adminCrawlsService.getCrawl(request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const createCrawl = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = createBusinessCrawlSchema.parse(request.body)
    const adminUserId = (request.user as { userId: string }).userId
    const data = await adminCrawlsService.createCrawl(adminUserId, body)
    return reply.code(201).send(successResponse(data))
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
    const data = await adminCrawlsService.updateCrawl(request.params.id, body)
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
    const data = await adminCrawlsService.publishCrawl(request.params.id)
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
    const data = await adminCrawlsService.cancelCrawl(request.params.id)
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
    const data = await adminCrawlsService.deleteCrawl(request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}
