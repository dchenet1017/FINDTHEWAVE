import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as inviteController from './invite.controller'

/**
 * Business-to-user deal/invite sending + recipient accept/decline.
 * Prefix: /api/invites
 */
export default async function inviteRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/', inviteController.getReceivedInvites)
  fastify.post('/:id/accept', inviteController.acceptInvite)
  fastify.post('/:id/decline', inviteController.declineInvite)

  fastify.post('/', { preHandler: requireRole('BUSINESS', 'ADMIN') }, inviteController.sendInvite)
  fastify.get('/sent', { preHandler: requireRole('BUSINESS', 'ADMIN') }, inviteController.getSentInvites)
}
