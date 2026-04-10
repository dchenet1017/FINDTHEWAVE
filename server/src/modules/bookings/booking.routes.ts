import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import * as bookingController from './booking.controller'
import {
  cancelBookingSchema,
  confirmPaymentSchema,
  createBookingSchema,
  declineBookingSchema,
  proposeBookingSchema,
  rescheduleBookingSchema,
  submitReviewSchema,
} from './booking.schema'

/**
 * Spec-compatible booking routes module.
 * Uses `:id` params and exports a default route plugin.
 */
export default async function bookingRoutes(fastify: FastifyInstance) {
  // All booking routes require authentication
  fastify.addHook('preHandler', authenticate)

  const waveLeaderOnly = [authenticate, requireRole('WAVELEADER', 'ADMIN')]

  fastify.post('/', { preHandler: validate({ body: createBookingSchema }) }, bookingController.createBooking)
  fastify.get('/:id', bookingController.getBooking)

  fastify.post(
    '/:id/confirm-payment',
    { preHandler: validate({ body: confirmPaymentSchema }) },
    bookingController.confirmPayment
  )

  fastify.post(
    '/:id/cancel',
    { preHandler: validate({ body: cancelBookingSchema }) },
    bookingController.cancelBooking
  )

  fastify.post(
    '/:id/reschedule',
    { preHandler: validate({ body: rescheduleBookingSchema }) },
    bookingController.rescheduleBooking
  )

  // WaveLeader actions
  fastify.post('/:id/accept', { preHandler: waveLeaderOnly }, bookingController.acceptBooking)
  fastify.post(
    '/:id/decline',
    { preHandler: [...waveLeaderOnly, validate({ body: declineBookingSchema })] },
    bookingController.declineBooking
  )
  fastify.post(
    '/:id/propose',
    { preHandler: [...waveLeaderOnly, validate({ body: proposeBookingSchema })] },
    bookingController.proposeNewTime
  )

  // Session management
  fastify.post('/:id/start', { preHandler: waveLeaderOnly }, bookingController.startSession)
  fastify.post('/:id/end', { preHandler: waveLeaderOnly }, bookingController.endSession)

  // Reviews
  fastify.post(
    '/:id/review',
    { preHandler: validate({ body: submitReviewSchema }) },
    bookingController.submitReview
  )
}

