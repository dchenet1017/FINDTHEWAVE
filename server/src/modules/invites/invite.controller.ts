import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { successResponse, errorResponse } from '../../utils/response'
import { NotFoundError, BadRequestError } from '../../utils/errors'
import * as inviteService from './invite.service'
import { sendInviteSchema } from './invite.schema'

function userId(request: FastifyRequest) {
  return (request.user as { userId: string }).userId
}

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

export const sendInvite = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = sendInviteSchema.parse(request.body)
    const data = await inviteService.sendInvite(userId(request), body)
    return reply.code(201).send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const getSentInvites = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await inviteService.listSentInvites(userId(request))
    return reply.send(successResponse({ items: data }))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const getReceivedInvites = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await inviteService.listReceivedInvites(userId(request))
    return reply.send(successResponse({ items: data }))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const acceptInvite = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await inviteService.acceptInvite(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}

export const declineInvite = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const data = await inviteService.declineInvite(userId(request), request.params.id)
    return reply.send(successResponse(data))
  } catch (e) {
    if (handleErrors(reply, e)) return
    throw e
  }
}
