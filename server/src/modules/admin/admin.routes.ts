import { FastifyInstance } from 'fastify'
import { authenticate, requireAdmin } from '../../middleware/authenticate'
import * as userController from './users/user.controller'
import * as businessController from './businesses/business.controller'
import * as waveLeaderController from './waveleaders/waveleader.controller'
import * as analyticsController from './analytics/analytics.controller'
import * as adminCrawlsController from './crawls/admin-crawls.controller'
import * as adminGoOutController from './go-out/admin-go-out.controller'
import * as adminDashboardController from './dashboard/admin-dashboard.controller'

export default async function adminRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all admin routes
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', requireAdmin)

  // Admin home page figures
  fastify.get('/dashboard', adminDashboardController.getDashboard)

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

  // Crawl management routes
  fastify.get('/crawls', adminCrawlsController.getCrawls)
  fastify.post('/crawls', adminCrawlsController.createCrawl)
  fastify.get('/crawls/:id', adminCrawlsController.getCrawl)
  fastify.patch('/crawls/:id', adminCrawlsController.updateCrawl)
  fastify.post('/crawls/:id/publish', adminCrawlsController.publishCrawl)
  fastify.post('/crawls/:id/cancel', adminCrawlsController.cancelCrawl)
  fastify.delete('/crawls/:id', adminCrawlsController.deleteCrawl)

  // Go-out queue oversight
  fastify.get('/go-out', adminGoOutController.getOverview)
  fastify.post('/go-out/offers/:id/withdraw', adminGoOutController.withdrawOffer)
}

