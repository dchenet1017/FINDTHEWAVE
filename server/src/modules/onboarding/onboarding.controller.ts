import { FastifyReply } from 'fastify'
import { onboardingService } from './onboarding.service'
import { errorResponse, successResponse } from '../../utils/response'
import { AuthenticatedRequest } from '../../middleware/authenticate'

function fail(reply: FastifyReply, error: any) {
  if (error.statusCode) {
    return reply
      .code(error.statusCode)
      .send(errorResponse(error.code || 'ERROR', error.message))
  }
  return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
}

export const onboardingController = {
  /**
   * GET /api/users/me/onboarding
   */
  getState: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const state = await onboardingService.getState(request.user.id)
      return reply.send(successResponse(state))
    } catch (error: any) {
      return fail(reply, error)
    }
  },

  /**
   * PATCH /api/users/me/onboarding
   */
  update: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const data = (request as any).validatedBody
      const state = await onboardingService.update(request.user.id, data)
      return reply.send(successResponse(state))
    } catch (error: any) {
      return fail(reply, error)
    }
  },

  /**
   * POST /api/users/me/onboarding/complete
   */
  complete: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const data = (request as any).validatedBody ?? {}
      const state = await onboardingService.complete(request.user.id, data)
      return reply.send(successResponse(state))
    } catch (error: any) {
      return fail(reply, error)
    }
  },
}
