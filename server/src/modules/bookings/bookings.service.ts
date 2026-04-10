import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../../lib/prisma'
import { stripe } from '../../lib/stripe'
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors'
import type { CreateBookingInput } from './bookings.schema'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map((n) => parseInt(n, 10))
  return h * 60 + (m || 0)
}

function parseScheduledDate(dateStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map((n) => parseInt(n, 10))
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0))
  return dt
}

function calculatePrice(hourlyRate: number, durationHours: number) {
  const subtotal = hourlyRate * durationHours
  const serviceFee = Math.round(subtotal * 0.15 * 100) / 100
  const total = Math.round((subtotal + serviceFee) * 100) / 100
  return { subtotal, serviceFee, total }
}

export function bookingStartMs(scheduledDate: Date, scheduledTime: string): number {
  const d = new Date(scheduledDate)
  const [h, mm] = scheduledTime.split(':').map((n) => parseInt(n, 10))
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    h || 0,
    mm || 0,
    0,
    0
  )
}

async function hasSlotConflict(
  waveLeaderId: string,
  scheduledDate: Date,
  scheduledTime: string,
  durationHours: number,
  excludeBookingId?: string
): Promise<boolean> {
  const newStart = timeToMinutes(scheduledTime)
  const newEnd = newStart + durationHours * 60

  const bookings = await prisma.booking.findMany({
    where: {
      waveLeaderId,
      scheduledDate,
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { scheduledTime: true, duration: true },
  })

  for (const b of bookings) {
    const s = timeToMinutes(b.scheduledTime)
    const e = s + b.duration * 60
    if (Math.max(newStart, s) < Math.min(newEnd, e)) {
      return true
    }
  }
  return false
}

export async function createBookingWithPaymentIntent(
  userId: string,
  input: CreateBookingInput
) {
  if (!stripe) {
    throw new BadRequestError('Stripe is not configured. Set STRIPE_SECRET_KEY on the server.')
  }

  const wl = await prisma.waveLeader.findUnique({
    where: { id: input.waveLeaderId },
    select: { id: true, hourlyRate: true, userId: true },
  })
  if (!wl) {
    throw new NotFoundError('WaveLeader not found')
  }
  if (wl.userId === userId) {
    throw new BadRequestError('You cannot book yourself')
  }

  const hourlyRate = Number(wl.hourlyRate)
  const { subtotal, serviceFee, total } = calculatePrice(hourlyRate, input.durationHours)
  const scheduledDate = parseScheduledDate(input.scheduledDate)

  const conflict = await hasSlotConflict(
    input.waveLeaderId,
    scheduledDate,
    input.scheduledTime,
    input.durationHours
  )
  if (conflict) {
    throw new BadRequestError('This time slot is no longer available')
  }

  const booking = await prisma.booking.create({
    data: {
      userId,
      waveLeaderId: input.waveLeaderId,
      status: 'PENDING',
      scheduledDate,
      scheduledTime: input.scheduledTime,
      duration: input.durationHours,
      totalAmount: new Decimal(total),
      serviceFee: new Decimal(serviceFee),
      serviceType: input.serviceType,
      location: input.location,
      notes: input.notes ?? null,
    },
  })

  const amountCents = Math.round(total * 100)
  if (amountCents < 50) {
    await prisma.booking.delete({ where: { id: booking.id } })
    throw new BadRequestError('Booking total is too small to charge')
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        userId,
      },
      payment_method_types: ['card'],
    })

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentIntentId: paymentIntent.id },
    })

    return {
      id: booking.id,
      clientSecret: paymentIntent.client_secret!,
    }
  } catch (e) {
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {})
    throw e
  }
}

export async function confirmBookingPayment(
  userId: string,
  bookingId: string,
  paymentIntentId: string
) {
  if (!stripe) {
    throw new BadRequestError('Stripe is not configured')
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      status: true,
      paymentIntentId: true,
      waveLeaderId: true,
    },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.userId !== userId) {
    throw new ForbiddenError('Not your booking')
  }
  if (booking.status !== 'PENDING') {
    throw new BadRequestError('Booking is not awaiting payment')
  }
  if (booking.paymentIntentId !== paymentIntentId) {
    throw new BadRequestError('Payment does not match this booking')
  }

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (pi.status !== 'succeeded') {
    throw new BadRequestError(`Payment not completed (status: ${pi.status})`)
  }

  const now = new Date()
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      paidAt: now,
      confirmedAt: now,
    },
  })

  return { id: bookingId, status: 'CONFIRMED' as const }
}

const bookingDetailInclude = {
  waveLeader: {
    select: {
      id: true,
      displayName: true,
      specialty: true,
      rating: true,
      totalReviews: true,
      location: true,
      user: { select: { avatar: true } },
    },
  },
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
} as const

export async function getBookingByIdForUser(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: bookingDetailInclude,
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  return booking
}

export function serializeBookingPublic(booking: Awaited<ReturnType<typeof getBookingByIdForUser>>) {
  const wl = booking.waveLeader
  return {
    id: booking.id,
    reference: `WF-${booking.id.slice(-8).toUpperCase()}`,
    status: booking.status,
    scheduledDate: booking.scheduledDate.toISOString().slice(0, 10),
    scheduledTime: booking.scheduledTime,
    duration: booking.duration,
    serviceType: booking.serviceType,
    location: booking.location,
    notes: booking.notes,
    totalAmount: Number(booking.totalAmount),
    serviceFee: Number(booking.serviceFee),
    // Don't expose Stripe IDs; clients should use paidAt/status instead.
    paymentIntentId: null,
    isPaid: !!booking.paidAt,
    paidAt: booking.paidAt ? booking.paidAt.toISOString() : null,
    rating: booking.rating,
    review: booking.review,
    reviewTags: (booking as any).reviewTags ?? [],
    reviewAnonymous: (booking as any).reviewAnonymous ?? false,
    cancelReason: booking.cancelReason,
    createdAt: booking.createdAt.toISOString(),
    waveLeader: wl
      ? {
          id: wl.id,
          displayName: wl.displayName,
          specialty: wl.specialty,
          rating: Number(wl.rating),
          totalReviews: wl.totalReviews,
          location: wl.location,
          avatar: wl.user?.avatar ?? null,
        }
      : null,
    userEmail: booking.user.email,
  }
}

export async function cancelUserBooking(
  userId: string,
  bookingId: string,
  reason?: string
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
    throw new BadRequestError('This booking cannot be cancelled')
  }
  const start = bookingStartMs(booking.scheduledDate, booking.scheduledTime)
  if (Date.now() > start + booking.duration * 60 * 60 * 1000) {
    throw new BadRequestError('Cannot cancel a booking that has already ended')
  }

  // Refund policy (hours until start):
  // - >= 24h: 100%
  // - >= 12h: 50%
  // - < 12h: 0%
  const hoursUntilStart = (start - Date.now()) / (1000 * 60 * 60)
  const total = Number(booking.totalAmount)
  const refundAmount =
    hoursUntilStart >= 24 ? total : hoursUntilStart >= 12 ? Math.round(total * 0.5 * 100) / 100 : 0

  let refundId: string | null = null
  if (refundAmount > 0 && booking.paymentIntentId && booking.paidAt) {
    if (!stripe) {
      throw new BadRequestError('Stripe is not configured. Unable to process refund.')
    }
    try {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        amount: Math.round(refundAmount * 100),
        reason: 'requested_by_customer',
      })
      refundId = refund.id
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to process refund'
      throw new BadRequestError(`Cancellation failed: ${message}`)
    }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelReason: reason ?? null,
      cancelledAt: new Date(),
      refundAmount: refundAmount > 0 ? new Decimal(refundAmount) : null,
    },
  })
  return { id: bookingId, status: 'CANCELLED' as const, refundAmount, refundId }
}

export async function rescheduleUserBooking(
  userId: string,
  bookingId: string,
  newDate: string,
  newTime: string
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.status !== 'CONFIRMED') {
    throw new BadRequestError('Only confirmed bookings can be rescheduled')
  }

  const scheduledDate = parseScheduledDate(newDate)
  if (!/^\d{2}:\d{2}$/.test(newTime)) {
    throw new BadRequestError('Invalid time format')
  }

  const conflict = await hasSlotConflict(
    booking.waveLeaderId,
    scheduledDate,
    newTime,
    booking.duration,
    bookingId
  )
  if (conflict) {
    throw new BadRequestError('That time slot is not available')
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      scheduledDate,
      scheduledTime: newTime,
    },
  })

  return getBookingByIdForUser(bookingId, userId)
}

async function getWaveLeaderIdByUserId(userId: string): Promise<string | null> {
  const wl = await prisma.waveLeader.findUnique({
    where: { userId },
    select: { id: true },
  })
  return wl?.id ?? null
}

export async function acceptBookingByWaveLeader(userId: string, bookingId: string) {
  const waveLeaderId = await getWaveLeaderIdByUserId(userId)
  if (!waveLeaderId) {
    throw new ForbiddenError('Only WaveLeaders can accept bookings')
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, waveLeaderId },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.status !== 'PENDING') {
    throw new BadRequestError('Only pending bookings can be accepted')
  }
  if (!booking.paidAt) {
    throw new BadRequestError(
      'Cannot accept booking - payment not yet received. Please wait for payment confirmation.'
    )
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  })
  return { id: bookingId, status: 'CONFIRMED' as const }
}

export async function declineBookingByWaveLeader(
  userId: string,
  bookingId: string,
  reason: string,
  message?: string
) {
  const waveLeaderId = await getWaveLeaderIdByUserId(userId)
  if (!waveLeaderId) {
    throw new ForbiddenError('Only WaveLeaders can decline bookings')
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, waveLeaderId },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.status !== 'PENDING') {
    throw new BadRequestError('Only pending bookings can be declined')
  }

  // Attempt full refund if payment exists (best-effort).
  const total = Number(booking.totalAmount)
  const refundAmount = total
  let refundId: string | null = null
  if (booking.paymentIntentId && booking.paidAt) {
    if (!stripe) {
      throw new BadRequestError('Stripe is not configured. Unable to process refund.')
    }
    try {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        reason: 'requested_by_customer',
      })
      refundId = refund.id
    } catch {
      // Decline should still proceed; refund can be handled manually if needed.
      refundId = null
    }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'DECLINED',
      cancelReason: reason,
      cancelledAt: new Date(),
      refundAmount: booking.paidAt ? new Decimal(refundAmount) : null,
      notes: message ? `${booking.notes ?? ''}\n[WaveLeader decline]: ${message}`.trim() : booking.notes,
    },
  })
  return { id: bookingId, status: 'DECLINED' as const, refundAmount: booking.paidAt ? refundAmount : 0, refundId }
}

export async function proposeBookingByWaveLeader(
  userId: string,
  bookingId: string,
  newDate: string,
  newTime: string,
  message?: string
) {
  const waveLeaderId = await getWaveLeaderIdByUserId(userId)
  if (!waveLeaderId) {
    throw new ForbiddenError('Only WaveLeaders can propose new times')
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, waveLeaderId },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.status !== 'PENDING') {
    throw new BadRequestError('Only pending bookings can receive a time proposal')
  }

  const scheduledDate = parseScheduledDate(newDate)
  if (!/^\d{2}:\d{2}$/.test(newTime)) {
    throw new BadRequestError('Invalid time format')
  }

  const conflict = await hasSlotConflict(
    waveLeaderId,
    scheduledDate,
    newTime,
    booking.duration,
    bookingId
  )
  if (conflict) {
    throw new BadRequestError('That time slot is not available')
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      scheduledDate,
      scheduledTime: newTime,
      notes: message ? `${booking.notes ?? ''}\n[Proposed time]: ${message}`.trim() : booking.notes,
    },
  })
  return { id: bookingId, scheduledDate: newDate, scheduledTime: newTime }
}

export async function startSessionByWaveLeader(userId: string, bookingId: string) {
  const waveLeaderId = await getWaveLeaderIdByUserId(userId)
  if (!waveLeaderId) {
    throw new ForbiddenError('Only WaveLeaders can start sessions')
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, waveLeaderId },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.status !== 'CONFIRMED') {
    throw new BadRequestError('Only confirmed bookings can be started')
  }

  const startMs = bookingStartMs(booking.scheduledDate, booking.scheduledTime)
  const fifteenMinBefore = startMs - 15 * 60 * 1000
  if (Date.now() < fifteenMinBefore) {
    throw new BadRequestError('You can only start a session up to 15 minutes before the scheduled time')
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  })
  return { id: bookingId, status: 'IN_PROGRESS' as const }
}

export async function endSessionByWaveLeader(userId: string, bookingId: string) {
  const waveLeaderId = await getWaveLeaderIdByUserId(userId)
  if (!waveLeaderId) {
    throw new ForbiddenError('Only WaveLeaders can end sessions')
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, waveLeaderId },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.status !== 'IN_PROGRESS') {
    throw new BadRequestError('Only in-progress bookings can be ended')
  }

  const completedAt = new Date()
  let actualDuration: Decimal | undefined
  if (booking.startedAt) {
    const hours = (completedAt.getTime() - booking.startedAt.getTime()) / (1000 * 60 * 60)
    actualDuration = new Decimal(Math.round(hours * 100) / 100)
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'COMPLETED',
      completedAt,
      ...(actualDuration !== undefined ? { actualDuration } : {}),
    },
  })
  return { id: bookingId, status: 'COMPLETED' as const }
}

export async function submitBookingReview(
  userId: string,
  bookingId: string,
  rating: number,
  review?: string,
  tags?: string[],
  anonymous?: boolean
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: { id: true, status: true, waveLeaderId: true, rating: true },
  })
  if (!booking) {
    throw new NotFoundError('Booking not found')
  }
  if (booking.status !== 'COMPLETED') {
    throw new BadRequestError('Only completed bookings can be reviewed')
  }
  if (booking.rating != null) {
    throw new BadRequestError('This booking has already been reviewed')
  }

  const tagsClean =
    tags?.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8) ?? []

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        rating,
        review: review?.trim() || null,
        reviewTags: tagsClean,
        reviewAnonymous: !!anonymous,
        reviewedAt: new Date(),
      },
    })

    const wl = await tx.waveLeader.findUnique({
      where: { id: booking.waveLeaderId },
      select: { rating: true, totalReviews: true },
    })
    if (!wl) return
    const total = wl.totalReviews
    const currentAvg = Number(wl.rating)
    const nextTotal = total + 1
    const nextAvg = (currentAvg * total + rating) / nextTotal

    await tx.waveLeader.update({
      where: { id: booking.waveLeaderId },
      data: {
        totalReviews: { increment: 1 },
        rating: new Decimal(Math.round(nextAvg * 100) / 100),
      },
    })
  })

  return { id: bookingId, rating }
}
