import { FastifyReply, FastifyRequest } from 'fastify'
import { successResponse } from '../../utils/response'
import * as bookingService from './booking.service'

// This file is a thin compatibility wrapper around the existing `bookings.*` module.
// It matches the handler names and `:id` param style requested in the spec.

const getUserId = (request: FastifyRequest): string =>
  (request as any).user?.userId || (request as any).user?.id

// POST /api/bookings
export const createBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = getUserId(request)
  const body = (request as any).validatedBody ?? request.body
  const result = await bookingService.createBookingWithPaymentIntent(userId, body)
  return reply.send(successResponse(result))
}

// GET /api/bookings/:id
export const getBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const booking = await bookingService.getBookingByIdForUser(id, userId)
  return reply.send(successResponse(bookingService.serializeBookingPublic(booking)))
}

// POST /api/bookings/:id/confirm-payment
export const confirmPayment = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const { paymentIntentId } = ((request as any).validatedBody ?? request.body) as {
    paymentIntentId: string
  }
  const result = await bookingService.confirmBookingPayment(userId, id, paymentIntentId)
  return reply.send(successResponse(result))
}

// POST /api/bookings/:id/cancel
export const cancelBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const { reason } = ((request as any).validatedBody ?? request.body) as { reason?: string }
  const result = await bookingService.cancelUserBooking(userId, id, reason)
  return reply.send(successResponse(result))
}

// POST /api/bookings/:id/reschedule
export const rescheduleBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const { newDate, newTime } = ((request as any).validatedBody ?? request.body) as {
    newDate: string
    newTime: string
  }
  const booking = await bookingService.rescheduleUserBooking(userId, id, newDate, newTime)
  return reply.send(successResponse(bookingService.serializeBookingPublic(booking)))
}

// POST /api/bookings/:id/accept
export const acceptBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const result = await bookingService.acceptBookingByWaveLeader(userId, id)
  return reply.send(successResponse(result))
}

// POST /api/bookings/:id/decline
export const declineBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const { reason, message } = ((request as any).validatedBody ?? request.body) as {
    reason: string
    message?: string
  }
  const result = await bookingService.declineBookingByWaveLeader(userId, id, reason, message)
  return reply.send(successResponse(result))
}

// POST /api/bookings/:id/propose
export const proposeNewTime = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const { newDate, newTime, message } = ((request as any).validatedBody ?? request.body) as {
    newDate: string
    newTime: string
    message?: string
  }
  const result = await bookingService.proposeBookingByWaveLeader(userId, id, newDate, newTime, message)
  return reply.send(successResponse(result))
}

// POST /api/bookings/:id/start
export const startSession = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const result = await bookingService.startSessionByWaveLeader(userId, id)
  return reply.send(successResponse(result))
}

// POST /api/bookings/:id/end
export const endSession = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const result = await bookingService.endSessionByWaveLeader(userId, id)
  return reply.send(successResponse(result))
}

// POST /api/bookings/:id/review
export const submitReview = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const userId = getUserId(request)
  const { rating, review, tags, anonymous } = ((request as any).validatedBody ?? request.body) as {
    rating: number
    review?: string
    tags?: string[]
    anonymous?: boolean
  }
  const result = await bookingService.submitBookingReview(userId, id, rating, review, tags, anonymous)
  return reply.send(successResponse(result))
}

