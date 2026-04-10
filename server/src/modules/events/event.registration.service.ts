import { prisma } from '../../lib/prisma'

export class RegistrationError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'RegistrationError'
    this.code = code
  }
}

function serializeAttendee(row: {
  id: string
  eventId: string
  userId: string
  registeredAt: Date
  status: string
  ticketsPurchased: number
  totalPaid: unknown | null
  paymentIntentId: string | null
  checkedIn: boolean
  checkedInAt: Date | null
}) {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    registeredAt: row.registeredAt.toISOString(),
    status: row.status,
    ticketsPurchased: row.ticketsPurchased,
    totalPaid: row.totalPaid != null ? Number(row.totalPaid) : null,
    paymentIntentId: row.paymentIntentId,
    checkedIn: row.checkedIn,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    qrPayload: JSON.stringify({ attendeeId: row.id, eventId: row.eventId }),
  }
}

export async function getMyRegistration(eventId: string, userId: string) {
  const row = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  })
  if (!row) return null
  if (row.status === 'CANCELLED') return null
  return serializeAttendee(row)
}

export async function registerForEvent(eventId: string, userId: string, tickets: number) {
  if (!Number.isFinite(tickets) || tickets < 1 || tickets > 10) {
    throw new RegistrationError('INVALID_TICKETS', 'Tickets must be between 1 and 10')
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, isPublished: true, status: 'PUBLISHED' },
  })
  if (!event) {
    throw new RegistrationError('NOT_FOUND', 'Event not found')
  }
  if (!event.requiresRegistration) {
    throw new RegistrationError('NO_REGISTRATION', 'This event does not require registration')
  }

  const now = new Date()
  if (event.registrationDeadline && now > event.registrationDeadline) {
    throw new RegistrationError('DEADLINE_PASSED', 'Registration deadline has passed')
  }

  const existing = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  })
  if (existing && existing.status !== 'CANCELLED') {
    throw new RegistrationError('ALREADY_REGISTERED', 'You are already registered for this event')
  }

  const price = event.ticketPrice != null ? Number(event.ticketPrice) : 0
  const totalPaid = price * tickets

  const max = event.maxAttendees
  const spotsLeft = max == null ? Infinity : Math.max(0, max - event.currentAttendees)
  if (spotsLeft <= 0) {
    throw new RegistrationError('SOLD_OUT', 'This event is sold out')
  }
  if (tickets > spotsLeft) {
    throw new RegistrationError(
      'NOT_ENOUGH_SPOTS',
      `Only ${spotsLeft} spot(s) remaining`
    )
  }

  await prisma.$transaction(async (tx) => {
    const evt = await tx.event.findUnique({ where: { id: eventId } })
    if (!evt || !evt.isPublished || evt.status !== 'PUBLISHED') {
      throw new RegistrationError('NOT_FOUND', 'Event not found')
    }
    if (evt.registrationDeadline && new Date() > evt.registrationDeadline) {
      throw new RegistrationError('DEADLINE_PASSED', 'Registration deadline has passed')
    }
    const left =
      evt.maxAttendees == null ? Infinity : Math.max(0, evt.maxAttendees - evt.currentAttendees)
    if (left < tickets) {
      throw new RegistrationError('NOT_ENOUGH_SPOTS', `Only ${left} spot(s) remaining`)
    }

    await tx.eventAttendee.create({
      data: {
        eventId,
        userId,
        ticketsPurchased: tickets,
        status: 'CONFIRMED',
        totalPaid: totalPaid > 0 ? totalPaid : null,
      },
    })
    await tx.event.update({
      where: { id: eventId },
      data: {
        currentAttendees: { increment: tickets },
        registrations: { increment: 1 },
      },
    })
  })

  const reg = await getMyRegistration(eventId, userId)
  return reg!
}

export async function joinWaitlist(eventId: string, userId: string, tickets: number) {
  const t = Math.min(10, Math.max(1, tickets))

  const event = await prisma.event.findFirst({
    where: { id: eventId, isPublished: true, status: 'PUBLISHED' },
  })
  if (!event) {
    throw new RegistrationError('NOT_FOUND', 'Event not found')
  }
  if (!event.requiresRegistration) {
    throw new RegistrationError('NO_REGISTRATION', 'This event does not require registration')
  }

  const now = new Date()
  if (event.registrationDeadline && now > event.registrationDeadline) {
    throw new RegistrationError('DEADLINE_PASSED', 'Registration deadline has passed')
  }

  const existing = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  })
  if (existing && existing.status !== 'CANCELLED') {
    throw new RegistrationError('ALREADY_REGISTERED', 'You already have a registration or waitlist spot')
  }

  const max = event.maxAttendees
  const spotsLeft = max == null ? Infinity : Math.max(0, max - event.currentAttendees)
  if (spotsLeft > 0) {
    throw new RegistrationError('SPOTS_AVAILABLE', 'Spots are still available — register normally')
  }

  const price = event.ticketPrice != null ? Number(event.ticketPrice) : 0
  const totalPaid = price * t

  await prisma.eventAttendee.create({
    data: {
      eventId,
      userId,
      ticketsPurchased: t,
      status: 'WAITLIST',
      totalPaid: totalPaid > 0 ? totalPaid : null,
    },
  })

  return getMyRegistration(eventId, userId) as Promise<NonNullable<Awaited<ReturnType<typeof getMyRegistration>>>>
}

export async function cancelRegistration(eventId: string, userId: string) {
  const row = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  })
  if (!row) {
    throw new RegistrationError('NOT_REGISTERED', 'No registration found')
  }

  if (row.status === 'WAITLIST') {
    await prisma.eventAttendee.delete({ where: { id: row.id } })
    return { cancelled: true }
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventAttendee.delete({ where: { id: row.id } })
    await tx.event.update({
      where: { id: eventId },
      data: {
        currentAttendees: { decrement: row.ticketsPurchased },
        registrations: { decrement: 1 },
      },
    })
  })

  return { cancelled: true }
}
