import { FastifyInstance } from 'fastify'
import * as controller from './waveleaders-public.controller'

export async function waveleadersPublicRoutes(server: FastifyInstance) {
  server.get('/', controller.list)
  server.get('/nearby', controller.nearby)
  server.get('/search', controller.search)
  server.get('/:id/availability', controller.getAvailability)
  server.get('/:id/reviews', controller.getReviews)
  server.get('/:id/review-stats', controller.getReviewStats)
}
