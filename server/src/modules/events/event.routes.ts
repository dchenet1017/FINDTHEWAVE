import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as eventController from './event.controller'

const registrationAuth = [
  authenticate,
  requireRole('USER', 'WAVELEADER', 'BUSINESS', 'ADMIN'),
]

/**
 * Public event discovery + authenticated registration.
 * Prefix: /api/events
 */
export default async function eventRoutes(fastify: FastifyInstance) {
  fastify.get('/', eventController.getEvents)
  fastify.get('/featured', eventController.getFeaturedEvents)
  fastify.get('/nearby', eventController.getNearbyEvents)
  fastify.get('/:id', eventController.getEventDetails)
  fastify.get('/:id/similar', eventController.getSimilarEvents)

  fastify.get('/:id/my-registration', { preHandler: registrationAuth }, eventController.getMyRegistration)
  fastify.post('/:id/register', { preHandler: registrationAuth }, eventController.registerForEvent)
  fastify.delete('/:id/register', { preHandler: registrationAuth }, eventController.cancelRegistration)

  fastify.post('/:id/view', eventController.incrementViews)
}
