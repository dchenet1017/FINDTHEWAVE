import { FastifyInstance } from 'fastify'

import { authenticate } from '../../middleware/authenticate'

import { requireRole } from '../../middleware/authorize'

import * as businessController from './business.controller'



export default async function businessRoutes(fastify: FastifyInstance) {

  // Business-owner routes are for authenticated business owners only.

  const businessAuth = [authenticate, requireRole('BUSINESS')]



  // Dashboard & Stats

  fastify.get('/dashboard', { preHandler: businessAuth }, businessController.getDashboard)

  fastify.get('/stats', { preHandler: businessAuth }, businessController.getStats)

  fastify.get('/revenue', { preHandler: businessAuth }, businessController.getRevenue)



  // Analytics

  fastify.get('/analytics', { preHandler: businessAuth }, businessController.getAnalytics)

  fastify.get('/analytics/peak-hours', { preHandler: businessAuth }, businessController.getPeakHours)

  fastify.get('/analytics/top-customers', { preHandler: businessAuth }, businessController.getTopCustomers)

  fastify.get(

    '/analytics/promotions-performance',

    { preHandler: businessAuth },

    businessController.getPromotionsPerformance

  )

  fastify.get('/analytics/customer-locations', { preHandler: businessAuth }, businessController.getCustomerLocations)



  // Check-ins

  fastify.get('/checkins/recent', { preHandler: businessAuth }, businessController.getRecentCheckIns)



  // Location

  fastify.get('/location', { preHandler: businessAuth }, businessController.getLocation)

  fastify.patch('/location', { preHandler: businessAuth }, businessController.updateLocation)



  // Competitors

  fastify.get('/competitors', { preHandler: businessAuth }, businessController.getCompetitors)

  fastify.get('/waveleaders', { preHandler: businessAuth }, businessController.getNearbyWaveLeaders)



  // Advertisements

  fastify.get('/ads', { preHandler: businessAuth }, businessController.getAdvertisements)

  fastify.post('/ads', { preHandler: businessAuth }, businessController.createAdvertisement)

  fastify.get('/ads/estimate', { preHandler: businessAuth }, businessController.estimateAdReach)

  fastify.patch('/ads/:id', { preHandler: businessAuth }, businessController.updateAdvertisement)

  fastify.delete('/ads/:id', { preHandler: businessAuth }, businessController.deleteAdvertisement)

  fastify.post('/ads/:id/pause', { preHandler: businessAuth }, businessController.pauseAdvertisement)

  fastify.post('/ads/:id/resume', { preHandler: businessAuth }, businessController.resumeAdvertisement)



  // Events (static and specific paths before /events/:id)

  fastify.get('/events/stats', { preHandler: businessAuth }, businessController.getEventStats)

  fastify.get('/events', { preHandler: businessAuth }, businessController.getBusinessEvents)

  fastify.post('/events', { preHandler: businessAuth }, businessController.createEvent)

  fastify.get('/events/:id/attendees', { preHandler: businessAuth }, businessController.getEventAttendees)

  fastify.get('/events/:id/analytics', { preHandler: businessAuth }, businessController.getEventAnalytics)

  fastify.post(

    '/events/:id/check-in/scan',

    { preHandler: businessAuth },

    businessController.checkInScan

  )

  fastify.post('/events/:id/check-in', { preHandler: businessAuth }, businessController.checkInAttendee)

  fastify.delete(

    '/events/:id/attendees/:attendeeId',

    { preHandler: businessAuth },

    businessController.removeAttendee

  )

  fastify.post('/events/:id/publish', { preHandler: businessAuth }, businessController.publishEvent)

  fastify.post('/events/:id/cancel', { preHandler: businessAuth }, businessController.cancelEvent)

  fastify.post('/events/:id/duplicate', { preHandler: businessAuth }, businessController.duplicateEvent)

  fastify.get('/events/:id', { preHandler: businessAuth }, businessController.getBusinessEventDetails)

  fastify.patch('/events/:id', { preHandler: businessAuth }, businessController.updateEvent)

  fastify.delete('/events/:id', { preHandler: businessAuth }, businessController.deleteEvent)

}


