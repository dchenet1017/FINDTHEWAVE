import { FastifyInstance } from 'fastify'
import { authenticate, requireAdmin } from '../../middleware/authenticate'
import * as userController from './users/user.controller'
import * as businessController from './businesses/business.controller'
import * as waveLeaderController from './waveleaders/waveleader.controller'
import * as analyticsController from './analytics/analytics.controller'

export default async function adminRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all admin routes
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', requireAdmin)

  // User management routes
  fastify.get('/users', userController.getUsers)
  fastify.get('/users/:id', userController.getUser)
  fastify.patch('/users/:id', userController.updateUser)
  fastify.delete('/users/:id', userController.deleteUser)
  fastify.post('/users/:id/suspend', userController.suspendUser)
  fastify.post('/users/:id/activate', userController.activateUser)
  fastify.post('/users/:id/verify', userController.verifyUser)
  fastify.post('/users/:id/change-role', userController.changeUserRole)
  fastify.post('/users/bulk', userController.bulkAction)

  // Business management routes
  fastify.get('/businesses', businessController.getBusinesses)
  fastify.get('/businesses/:id', businessController.getBusiness)
  fastify.patch('/businesses/:id', businessController.updateBusiness)
  fastify.post('/businesses/:id/approve', businessController.approveBusiness)
  fastify.post('/businesses/:id/reject', businessController.rejectBusiness)
  fastify.delete('/businesses/:id', businessController.deleteBusiness)

  // WaveLeader management routes
  fastify.get('/waveleaders', waveLeaderController.getWaveLeaders)
  fastify.get('/waveleaders/:id', waveLeaderController.getWaveLeader)
  fastify.patch('/waveleaders/:id', waveLeaderController.updateWaveLeader)
  fastify.post('/waveleaders/:id/verify', waveLeaderController.verifyWaveLeader)
  fastify.post('/waveleaders/:id/suspend', waveLeaderController.suspendWaveLeader)
  fastify.post('/waveleaders/:id/activate', waveLeaderController.activateWaveLeader)
  fastify.delete('/waveleaders/:id', waveLeaderController.deleteWaveLeader)

  // Analytics routes
  fastify.get('/analytics/overview', analyticsController.getOverview)
  fastify.get('/analytics/users', analyticsController.getUserAnalytics)
  fastify.get('/analytics/revenue', analyticsController.getRevenueAnalytics)
}

