import { FastifyInstance } from 'fastify'
import { waveleaderController } from './waveleader.controller'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authenticate'

const waveLeaderAuth = [authenticate, requireRole('WAVELEADER', 'ADMIN')]

export async function waveleaderRoutes(server: FastifyInstance) {
  // Public routes
  server.get('/', waveleaderController.getWaveLeaders)
  server.get('/nearby', waveleaderController.getNearbyWaveLeaders)
  server.get('/search', waveleaderController.searchWaveLeaders)

  server.post(
    '/register',
    {
      preHandler: [authenticate, requireRole('USER', 'WAVELEADER', 'ADMIN')],
    },
    waveleaderController.register
  )

  server.get(
    '/dashboard',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getDashboard
  )

  server.get(
    '/stats',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getStats
  )

  server.get(
    '/me',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getMe
  )

  server.patch(
    '/me',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.updateMe
  )

  server.patch(
    '/me/availability',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.updateAvailability
  )

  server.get(
    '/me/service-area',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getServiceArea
  )

  server.put(
    '/me/service-area',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.updateServiceArea
  )

  server.get(
    '/opportunities',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getOpportunities
  )

  server.get(
    '/bookings/stats',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getBookingsStats
  )

  server.get(
    '/bookings',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getBookings
  )

  server.get(
    '/bookings/locations',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getBookingLocations
  )

  server.get(
    '/earnings/heatmap',
    {
      preHandler: [authenticate, requireRole('WAVELEADER', 'ADMIN')],
    },
    waveleaderController.getEarningsHeatmap
  )

  server.get('/:id/profile', waveleaderController.getPublicProfile)
  server.get('/:id/reviews', waveleaderController.getReviews)
  server.get('/:id/availability', waveleaderController.getAvailability)
  server.get('/:id/slots', waveleaderController.getSlots)

  // Portfolio (WaveLeader-only)
  server.post(
    '/me/portfolio/upload',
    { preHandler: waveLeaderAuth },
    waveleaderController.uploadPortfolioImage
  )
  server.delete(
    '/me/portfolio/:imageId',
    { preHandler: waveLeaderAuth },
    waveleaderController.deletePortfolioImage
  )
}
