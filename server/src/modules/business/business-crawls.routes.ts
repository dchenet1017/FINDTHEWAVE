import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as crawlsController from './business-crawls.controller'

/**
 * Business-owner crawl management (host CRUD + per-stop check-in).
 * Prefix: /api/business/crawls
 */
export default async function businessCrawlsRoutes(fastify: FastifyInstance) {
  const businessAuth = [authenticate, requireRole('BUSINESS')]

  fastify.get('/stats', { preHandler: businessAuth }, crawlsController.getStats)
  fastify.get('/my-stops', { preHandler: businessAuth }, crawlsController.getMyStops)

  fastify.get('/', { preHandler: businessAuth }, crawlsController.listCrawls)
  fastify.post('/', { preHandler: businessAuth }, crawlsController.createCrawl)

  fastify.get('/:id/attendees', { preHandler: businessAuth }, crawlsController.getAttendees)
  fastify.post('/:id/stops/:stopId/check-in', { preHandler: businessAuth }, crawlsController.checkInAtStop)
  fastify.post('/:id/publish', { preHandler: businessAuth }, crawlsController.publishCrawl)
  fastify.post('/:id/cancel', { preHandler: businessAuth }, crawlsController.cancelCrawl)
  fastify.post('/:id/duplicate', { preHandler: businessAuth }, crawlsController.duplicateCrawl)

  fastify.get('/:id', { preHandler: businessAuth }, crawlsController.getCrawl)
  fastify.patch('/:id', { preHandler: businessAuth }, crawlsController.updateCrawl)
  fastify.delete('/:id', { preHandler: businessAuth }, crawlsController.deleteCrawl)
}
