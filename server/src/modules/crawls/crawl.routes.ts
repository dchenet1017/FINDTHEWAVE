import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as crawlController from './crawl.controller'

const registrationAuth = [
  authenticate,
  requireRole('USER', 'WAVELEADER', 'BUSINESS', 'ADMIN'),
]

/**
 * Public crawl discovery + authenticated registration.
 * Prefix: /api/crawls
 */
export default async function crawlRoutes(fastify: FastifyInstance) {
  fastify.get('/', crawlController.getCrawls)
  fastify.get('/nearby', crawlController.getNearbyCrawls)
  fastify.get('/:id', crawlController.getCrawlDetails)

  fastify.get('/:id/my-registration', { preHandler: registrationAuth }, crawlController.getMyRegistration)
  fastify.post('/:id/register', { preHandler: registrationAuth }, crawlController.registerForCrawl)
  fastify.delete('/:id/register', { preHandler: registrationAuth }, crawlController.cancelRegistration)
}
