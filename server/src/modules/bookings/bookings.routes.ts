import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import { bookingsController } from './bookings.controller'
import {
  cancelBookingSchema,
  confirmPaymentSchema,
  createBookingSchema,
  declineBookingSchema,
  proposeBookingSchema,
  rescheduleBookingSchema,
  submitReviewSchema,
} from './bookings.schema'

const waveLeaderOnly = [authenticate, requireRole('WAVELEADER', 'ADMIN')]

export async function bookingRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate)

  server.post(
    '/',
    { preHandler: validate({ body: createBookingSchema }) },
    bookingsController.createBooking
  )

  server.post(
    '/:bookingId/confirm-payment',
    { preHandler: validate({ body: confirmPaymentSchema }) },
    bookingsController.confirmPayment
  )

  server.get('/:bookingId', bookingsController.getBooking)

  server.post(
    '/:bookingId/cancel',
    { preHandler: validate({ body: cancelBookingSchema }) },
    bookingsController.cancelBooking
  )

  server.post(
    '/:bookingId/reschedule',
    { preHandler: validate({ body: rescheduleBookingSchema }) },
    bookingsController.rescheduleBooking
  )

  server.post(
    '/:bookingId/accept',
    { preHandler: waveLeaderOnly },
    bookingsController.acceptBooking
  )

  server.post(
    '/:bookingId/decline',
    { preHandler: [...waveLeaderOnly, validate({ body: declineBookingSchema })] },
    bookingsController.declineBooking
  )

  server.post(
    '/:bookingId/propose',
    { preHandler: [...waveLeaderOnly, validate({ body: proposeBookingSchema })] },
    bookingsController.proposeBooking
  )

  server.post(
    '/:bookingId/start',
    { preHandler: waveLeaderOnly },
    bookingsController.startSession
  )

  server.post(
    '/:bookingId/end',
    { preHandler: waveLeaderOnly },
    bookingsController.endSession
  )

  server.post(
    '/:bookingId/review',
    { preHandler: validate({ body: submitReviewSchema }) },
    bookingsController.submitReview
  )
}
