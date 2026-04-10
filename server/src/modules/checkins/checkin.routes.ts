import { FastifyInstance } from 'fastify'
import { checkInController } from './checkin.controller'
import { authenticate } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import { checkInBodySchema, canCheckInQuerySchema } from './checkin.schema'

export async function checkInRoutes(server: FastifyInstance) {
  // All check-in routes require authentication
  server.addHook('preHandler', authenticate)

  // Check if user can check in
  server.get(
    '/can-check-in/:businessId',
    {
      preHandler: validate({ query: canCheckInQuerySchema }),
    },
    checkInController.canCheckIn
  )

  // Perform check-in
  server.post(
    '/:businessId',
    {
      preHandler: validate({ body: checkInBodySchema }),
    },
    checkInController.checkIn
  )

  // Get check-in history
  server.get('/', checkInController.getHistory)

  // Get unique check-in locations
  server.get('/locations', checkInController.getLocations)
}

