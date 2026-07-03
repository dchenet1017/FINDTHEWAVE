import { FastifyRequest, FastifyReply } from 'fastify'
import { successResponse, errorResponse } from '../../utils/response'
import { NotFoundError } from '../../utils/errors'
import * as notificationService from './notification.service'

function userId(request: FastifyRequest) {
  return (request.user as { userId: string }).userId
}

export const getNotifications = async (
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply
) => {
  try {
    const limit = request.query.limit != null ? parseInt(request.query.limit, 10) : 50
    const data = await notificationService.listNotifications(userId(request), limit)
    return reply.send(successResponse(data))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load notifications'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const markRead = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await notificationService.markRead(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return reply.code(404).send(errorResponse('NOT_FOUND', error.message))
    }
    const message = error instanceof Error ? error.message : 'Failed to mark as read'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}

export const markAllRead = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await notificationService.markAllRead(userId(request))
    return reply.send(successResponse(data))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mark all as read'
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', message))
  }
}
