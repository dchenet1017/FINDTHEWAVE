import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as goOutController from './go-out.controller'

/**
 * "Go Out" availability queue.
 * Prefix: /api/go-out
 */
export default async function goOutRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  fastify.post('/activate', goOutController.activate)
  fastify.post('/deactivate', goOutController.deactivate)
  fastify.get('/status', goOutController.getStatus)

  fastify.get('/nearby', { preHandler: requireRole('BUSINESS', 'ADMIN') }, goOutController.getNearby)
}
