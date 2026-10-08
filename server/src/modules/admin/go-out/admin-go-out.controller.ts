import { FastifyReply, FastifyRequest } from 'fastify'
import { successResponse, errorResponse } from '../../../utils/response'
import { AppError } from '../../../utils/errors'
import * as adminGoOutService from './admin-go-out.service'

function fail(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send(errorResponse(error.code, error.message))
  }
  console.error('[admin go-out] unhandled error', error)
  return reply.code(500).send(errorResponse('INTERNAL_ERROR', 'Something went wrong'))
}

/** GET /api/admin/go-out */
export const getOverview = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    return reply.send(successResponse(await adminGoOutService.getOverview()))
  } catch (error) {
    return fail(reply, error)
  }
}

/** POST /api/admin/go-out/offers/:id/withdraw */
export const withdrawOffer = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    return reply.send(successResponse(await adminGoOutService.withdrawOffer(request.params.id)))
  } catch (error) {
    return fail(reply, error)
  }
}
