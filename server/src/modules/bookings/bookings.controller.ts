import { FastifyReply } from 'fastify'
import { AuthenticatedRequest } from '../../middleware/authenticate'
import { successResponse } from '../../utils/response'
import * as bookingsService from './bookings.service'

export const bookingsController = {
  async createBooking(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const body = (request as { validatedBody: import('./bookings.schema').CreateBookingInput })
      .validatedBody
    const result = await bookingsService.createBookingWithPaymentIntent(userId, body)
    return reply.send(successResponse(result))
  },

  async confirmPayment(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const { paymentIntentId } = (request as { validatedBody: { paymentIntentId: string } })
      .validatedBody
    const result = await bookingsService.confirmBookingPayment(
      userId,
      bookingId,
      paymentIntentId
    )
    return reply.send(successResponse(result))
  },

  async getBooking(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const booking = await bookingsService.getBookingByIdForUser(bookingId, userId)
    return reply.send(successResponse(bookingsService.serializeBookingPublic(booking)))
  },

  async cancelBooking(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const { reason } = (request as { validatedBody: { reason?: string } }).validatedBody
    const result = await bookingsService.cancelUserBooking(userId, bookingId, reason)
    return reply.send(successResponse(result))
  },

  async rescheduleBooking(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const { newDate, newTime } = (request as {
      validatedBody: { newDate: string; newTime: string }
    }).validatedBody
    const booking = await bookingsService.rescheduleUserBooking(
      userId,
      bookingId,
      newDate,
      newTime
    )
    return reply.send(successResponse(bookingsService.serializeBookingPublic(booking)))
  },

  async acceptBooking(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const result = await bookingsService.acceptBookingByWaveLeader(userId, bookingId)
    return reply.send(successResponse(result))
  },

  async declineBooking(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const { reason, message } = (request as {
      validatedBody: { reason: string; message?: string }
    }).validatedBody
    const result = await bookingsService.declineBookingByWaveLeader(
      userId,
      bookingId,
      reason,
      message
    )
    return reply.send(successResponse(result))
  },

  async proposeBooking(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const { newDate, newTime, message } = (request as {
      validatedBody: { newDate: string; newTime: string; message?: string }
    }).validatedBody
    const result = await bookingsService.proposeBookingByWaveLeader(
      userId,
      bookingId,
      newDate,
      newTime,
      message
    )
    return reply.send(successResponse(result))
  },

  async startSession(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const result = await bookingsService.startSessionByWaveLeader(userId, bookingId)
    return reply.send(successResponse(result))
  },

  async endSession(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const result = await bookingsService.endSessionByWaveLeader(userId, bookingId)
    return reply.send(successResponse(result))
  },

  async submitReview(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user.userId
    const { bookingId } = request.params as { bookingId: string }
    const { rating, review, tags, anonymous } = (request as {
      validatedBody: { rating: number; review?: string; tags?: string[]; anonymous?: boolean }
    }).validatedBody

    const result = await bookingsService.submitBookingReview(
      userId,
      bookingId,
      rating,
      review,
      tags,
      anonymous
    )
    return reply.send(successResponse(result))
  },
}
