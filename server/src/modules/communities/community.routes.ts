import { FastifyInstance } from 'fastify'
import { communityController } from './community.controller'
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import { updateAvailabilitySchema } from './community.schema'

export async function communityRoutes(server: FastifyInstance) {
  // Public routes
  server.get('/', communityController.getCommunities)
  server.get('/:id', { preHandler: optionalAuthenticate }, communityController.getCommunity)
  server.get('/:id/members', communityController.getCommunityMembers)
  server.get('/:id/waveleaders', communityController.getCommunityWaveLeaders)

  // Authenticated routes
  server.post('/:id/join', { preHandler: authenticate }, communityController.joinCommunity)
  server.post('/:id/leave', { preHandler: authenticate }, communityController.leaveCommunity)
  server.patch(
    '/:id/availability',
    {
      preHandler: [authenticate, validate({ body: updateAvailabilitySchema })],
    },
    communityController.updateAvailability
  )
}
