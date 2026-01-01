import { FastifyInstance } from 'fastify'
import { businessController } from './business.controller'
import { authenticate } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import {
  createBusinessSchema,
  updateBusinessSchema,
  createPromotionSchema,
  nearbyQuerySchema,
  mapBoundsSchema,
} from './business.schema'

export async function businessRoutes(server: FastifyInstance) {
  // Public listing
  server.get('/', businessController.list)
  server.get(
    '/nearby',
    { preHandler: validate({ query: nearbyQuerySchema }) },
    businessController.nearby
  )
  server.get('/search', businessController.search)
  server.get(
    '/map',
    { preHandler: validate({ query: mapBoundsSchema }) },
    businessController.map
  )
  server.get('/types/counts', businessController.typeCounts)

  // Authenticated specific business for current user (placed before :id)
  server.get('/my/business', { preHandler: [authenticate] }, businessController.getMyBusiness)

  // Public by id
  server.get('/:id', businessController.getById)

  // Authenticated routes
  server.post(
    '/',
    { preHandler: [authenticate, validate({ body: createBusinessSchema })] },
    businessController.create
  )
  server.patch(
    '/:id',
    { preHandler: [authenticate, validate({ body: updateBusinessSchema })] },
    businessController.update
  )
  server.delete('/:id', { preHandler: [authenticate] }, businessController.remove)
  server.post(
    '/:id/promotions',
    { preHandler: [authenticate, validate({ body: createPromotionSchema })] },
    businessController.createPromotion
  )
}

