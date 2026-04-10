import { FastifyInstance } from 'fastify'
import { userController } from './user.controller'
import { authenticate } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import { updateProfileSchema, updateSettingsSchema } from './user.schema'
import multipart from '@fastify/multipart'

export async function userRoutes(server: FastifyInstance) {
  // Register multipart for file uploads
  await server.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  })

  // All routes require authentication
  server.addHook('preHandler', authenticate)

  // Profile routes
  server.get('/me/profile', userController.getProfile)
  server.patch(
    '/me/profile',
    { preHandler: validate({ body: updateProfileSchema }) },
    userController.updateProfile
  )

  // Avatar upload
  server.post('/me/avatar', userController.uploadAvatar)

  // Settings routes
  server.patch(
    '/me/settings',
    { preHandler: validate({ body: updateSettingsSchema }) },
    userController.updateSettings
  )

  // Account deletion
  server.delete('/me', userController.deleteAccount)

  // Stats & Dashboard
  server.get('/me/stats', userController.getStats)
  server.get('/me/activity', userController.getActivity)
  server.get('/me/bookings', userController.getBookings)
  server.get('/me/events', userController.getMyEvents)

  // Passport
  server.get('/me/passport', userController.getPassport)

  // Check-ins
  server.get('/me/checkins', userController.getCheckInHistory)
  server.get('/me/checkins/locations', userController.getCheckInLocations)

  // Communities
  server.get('/me/communities', userController.getMyCommunities)

  // Favorites
  server.get('/me/favorites', userController.getFavorites)
  server.post('/me/favorites/:businessId', userController.addFavorite)
  server.delete('/me/favorites/:businessId', userController.removeFavorite)

  // Settings
  server.get('/me/settings', userController.getSettings)
}

