import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import * as notificationController from './notification.controller'

/**
 * Authenticated user notifications (bell-icon feed).
 * Prefix: /api/notifications
 */
export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/', notificationController.getNotifications)
  fastify.post('/read-all', notificationController.markAllRead)
  fastify.post('/:id/read', notificationController.markRead)
}
