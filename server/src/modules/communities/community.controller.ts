import { FastifyRequest, FastifyReply } from 'fastify'
import { communityService } from './community.service'
import { errorResponse, successResponse } from '../../utils/response'
import { AuthenticatedRequest } from '../../middleware/authenticate'

export const communityController = {
  /**
   * GET /api/communities - List all communities
   */
  getCommunities: async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const communities = await communityService.getAllCommunities()
      return reply.send(successResponse(communities))
    } catch (error: any) {
      if (error.statusCode) {
        return reply
          .code(error.statusCode)
          .send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/communities/:id - Get community details (optional userId for isMember)
   */
  getCommunity: async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params
      const userId = (request as AuthenticatedRequest & { user?: { userId: string } }).user
        ?.userId
      const community = await communityService.getCommunityById(id, userId)
      return reply.send(successResponse(community))
    } catch (error: any) {
      if (error.statusCode) {
        return reply
          .code(error.statusCode)
          .send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/communities/:id/members - Get community members
   */
  getCommunityMembers: async (
    request: FastifyRequest<{
      Params: { id: string }
      Querystring: { page?: string; limit?: string }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params
      const page = request.query.page ? parseInt(request.query.page, 10) : 1
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20
      const result = await communityService.getCommunityMembers(id, { page, limit })
      return reply.send(successResponse(result))
    } catch (error: any) {
      if (error.statusCode) {
        return reply
          .code(error.statusCode)
          .send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * GET /api/communities/:id/waveleaders - Get community WaveLeaders
   */
  getCommunityWaveLeaders: async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params
      const waveLeaders = await communityService.getCommunityWaveLeaders(id)
      return reply.send(successResponse(waveLeaders))
    } catch (error: any) {
      if (error.statusCode) {
        return reply
          .code(error.statusCode)
          .send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * POST /api/communities/:id/join - Join community
   */
  joinCommunity: async (
    request: AuthenticatedRequest & { params: { id: string } },
    reply: FastifyReply
  ) => {
    try {
      const { id: communityId } = request.params
      const userId = request.user.userId
      const membership = await communityService.joinCommunity(userId, communityId)
      return reply.send(successResponse(membership))
    } catch (error: any) {
      if (error.statusCode) {
        return reply
          .code(error.statusCode)
          .send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * POST /api/communities/:id/leave - Leave community
   */
  leaveCommunity: async (
    request: AuthenticatedRequest & { params: { id: string } },
    reply: FastifyReply
  ) => {
    try {
      const { id: communityId } = request.params
      const userId = request.user.userId
      await communityService.leaveCommunity(userId, communityId)
      return reply.send(successResponse({ message: 'Left community successfully' }))
    } catch (error: any) {
      if (error.statusCode) {
        return reply
          .code(error.statusCode)
          .send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },

  /**
   * PATCH /api/communities/:id/availability - Update member availability
   */
  updateAvailability: async (
    request: AuthenticatedRequest & {
      params: { id: string }
      body: { isAvailable: boolean }
    },
    reply: FastifyReply
  ) => {
    try {
      const { id: communityId } = request.params
      const { isAvailable } = (request as any).validatedBody || request.body
      const userId = request.user.userId
      const membership = await communityService.updateMemberAvailability(
        userId,
        communityId,
        isAvailable
      )
      return reply.send(
        successResponse({
          id: membership.id,
          isAvailable: membership.isAvailable,
        })
      )
    } catch (error: any) {
      if (error.statusCode) {
        return reply
          .code(error.statusCode)
          .send(errorResponse(error.code || 'ERROR', error.message))
      }
      return reply.code(500).send(errorResponse('INTERNAL_ERROR', error.message))
    }
  },
}
