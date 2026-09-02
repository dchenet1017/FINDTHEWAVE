import { FastifyRequest, FastifyReply } from 'fastify'
import { successResponse, errorResponse } from '../../utils/response'
import { AppError } from '../../utils/errors'
import * as goOutService from './go-out.service'
import type {
  ActiveDemandQuery,
  RaiseHandInput,
  RespondOfferInput,
  SendOfferInput,
} from './go-out.schema'

function userId(request: FastifyRequest) {
  return (request.user as { userId: string }).userId
}

function fail(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    return reply
      .code(error.statusCode)
      .send(errorResponse(error.code || 'ERROR', error.message))
  }
  console.error('[go-out] unhandled error', error)
  return reply
    .code(500)
    .send(errorResponse('INTERNAL_ERROR', 'Something went wrong'))
}

/** POST /api/go-out/raise-hand */
export const raiseHand = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = (request as any).validatedBody as RaiseHandInput
    const intent = await goOutService.raiseHand(userId(request), body)
    return reply.code(201).send(successResponse(intent))
  } catch (error) {
    return fail(reply, error)
  }
}

/** DELETE /api/go-out/lower-hand */
export const lowerHand = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const intent = await goOutService.lowerHand(userId(request))
    return reply.send(successResponse(intent))
  } catch (error) {
    return fail(reply, error)
  }
}

/** GET /api/go-out/my-intent */
export const getMyIntent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await goOutService.getMyIntent(userId(request))
    return reply.send(successResponse(data))
  } catch (error) {
    return fail(reply, error)
  }
}

/** GET /api/go-out/active-demand - business/admin only, aggregates only */
export const getActiveDemand = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = (request as any).validatedQuery as ActiveDemandQuery
    const data = await goOutService.getActiveDemand(
      userId(request),
      query.radius,
      query.lat,
      query.lng
    )
    return reply.send(successResponse(data))
  } catch (error) {
    return fail(reply, error)
  }
}

/** POST /api/go-out/send-offer - business/admin only */
export const sendOffer = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = (request as any).validatedBody as SendOfferInput
    const data = await goOutService.sendOffer(userId(request), body)
    return reply.code(201).send(successResponse(data))
  } catch (error) {
    return fail(reply, error)
  }
}

/** GET /api/go-out/sent-offers - business/admin only */
export const getSentOffers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await goOutService.getSentOffers(userId(request))
    return reply.send(successResponse(data))
  } catch (error) {
    return fail(reply, error)
  }
}

/** GET /api/go-out/my-offers */
export const getMyOffers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await goOutService.getMyOffers(userId(request))
    return reply.send(successResponse(data))
  } catch (error) {
    return fail(reply, error)
  }
}

/** POST /api/go-out/respond-offer/:offerId */
export const respondToOffer = async (
  request: FastifyRequest<{ Params: { offerId: string } }>,
  reply: FastifyReply
) => {
  try {
    const body = (request as any).validatedBody as RespondOfferInput
    const data = await goOutService.respondToOffer(
      userId(request),
      request.params.offerId,
      body
    )
    return reply.send(successResponse(data))
  } catch (error) {
    return fail(reply, error)
  }
}

/** GET /api/go-out/active-venues - public; business ids only */
export const getActiveVenues = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await goOutService.getActiveOfferVenueIds()
    return reply.send(successResponse(data))
  } catch (error) {
    return fail(reply, error)
  }
}
