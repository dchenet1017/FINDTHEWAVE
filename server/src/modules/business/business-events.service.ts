import type { EventCategory, EventStatus, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, BadRequestError } from '../../utils/errors'
import type { z } from 'zod'
import type { createBusinessEventSchema, updateBusinessEventSchema } from './business-events.schema'

type CreateInput = z.infer<typeof createBusinessEventSchema>
type UpdateInput = z.infer<typeof updateBusinessEventSchema>

async function businessForUser(userId: string) {
  const business = await prisma.business.findUnique({ where: { userId } })
  if (!business) throw new NotFoundError('Business not found for this user')
  return business
}

function serializeEvent(row: Record<string, unknown>) {
  const o = { ...row } as any
  ;[
    'ticketPrice',
    'waveLeaderRate',
    'startDate',
    'endDate',
    'registrationDeadline',
    'scheduledPublishAt',
    'createdAt',
    'updatedAt',
  ].forEach((k) => {
    if (o[k] == null) return
    if (k.includes('Price') || k.includes('Rate')) o[k] = Number(o[k])
    else o[k] = new Date(o[k]).toISOString()
  })
  return o
}

async function assertEventOwned(eventId: string, businessId: string) {
  const ev = await prisma.event.findFirst({ where: { id: eventId, businessId } })
  if (!ev) throw new NotFoundError('Event not found')
  return ev
}

function applyPublishMode(
  data: CreateInput | UpdateInput,
  existing?: { status: EventStatus; isPublished: boolean }
): Pick<Prisma.EventUpdateInput, 'status' | 'isPublished' | 'scheduledPublishAt'> {
  const mode = data.publishMode ?? 'draft'
  if (mode === 'publish') {
    return { status: 'PUBLISHED', isPublished: true, scheduledPublishAt: null }
  }
  if (mode === 'schedule' && data.scheduledPublishAt) {
    return {
      status: 'DRAFT',
      isPublished: false,
      scheduledPublishAt: new Date(data.scheduledPublishAt as Date),
    }
  }
  if (mode === 'draft') {
    return {
      status: 'DRAFT',
      isPublished: false,
      scheduledPublishAt: data.scheduledPublishAt
        ? new Date(data.scheduledPublishAt as Date)
        : null,
    }
  }
  return {
    status: (existing?.status as EventStatus) ?? 'DRAFT',
    isPublished: existing?.isPublished ?? false,
    scheduledPublishAt: data.scheduledPublishAt
      ? new Date(data.scheduledPublishAt as Date)
      : null,
  }
}

function toCreateData(
  businessId: string,
  input: CreateInput
): Prisma.EventCreateInput {
  const pub = applyPublishMode(input)
  const img = input.imageUrl === '' ? null : input.imageUrl ?? null
  const vlink = input.virtualLink === '' ? null : input.virtualLink ?? null
  const regDeadline = input.registrationDeadline
    ? new Date(input.registrationDeadline as Date)
    : null

  return {
    business: { connect: { id: businessId } },
    title: input.title,
    description: input.description || '',
    category: input.category as EventCategory,
    tags: input.tags ?? [],
    imageUrl: img,
    highlights: input.highlights ?? [],
    whatsIncluded: input.whatsIncluded ?? [],
    whatToBring: input.whatToBring ?? [],
    specialInstructions: input.specialInstructions ?? null,
    ageRestrictions: input.ageRestrictions ?? null,
    accessibilityInfo: input.accessibilityInfo ?? null,
    venueName: input.venueName ?? null,
    address: input.address ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    isVirtual: input.isVirtual,
    virtualLink: vlink,
    startDate: new Date(input.startDate as Date),
    endDate: new Date(input.endDate as Date),
    timezone: input.timezone,
    requiresRegistration: input.requiresRegistration,
    maxAttendees: input.maxAttendees ?? null,
    registrationDeadline: regDeadline,
    ticketPrice: input.ticketPrice != null ? input.ticketPrice : null,
    featuredWaveLeaderId: input.featuredWaveLeaderId || null,
    waveLeaderRate: input.waveLeaderRate != null ? input.waveLeaderRate : null,
    isFeatured: input.isFeatured,
    status: pub.status as EventStatus,
    isPublished: Boolean(pub.isPublished),
    scheduledPublishAt: pub.scheduledPublishAt ?? null,
  }
}

export async function getBusinessEventStats(userId: string) {
  const b = await businessForUser(userId)
  const now = new Date()
  const [totalEvents, upcomingEvents, draftEvents, regAgg, checkAgg] = await Promise.all([
    prisma.event.count({ where: { businessId: b.id } }),
    prisma.event.count({
      where: {
        businessId: b.id,
        status: 'PUBLISHED',
        isPublished: true,
        endDate: { gte: now },
      },
    }),
    prisma.event.count({ where: { businessId: b.id, status: 'DRAFT' } }),
    prisma.event.aggregate({
      where: { businessId: b.id },
      _sum: { registrations: true },
    }),
    prisma.event.aggregate({
      where: { businessId: b.id },
      _sum: { checkIns: true },
    }),
  ])
  return {
    totalEvents,
    upcomingEvents,
    draftEvents,
    totalRegistrations: regAgg._sum.registrations ?? 0,
    totalCheckIns: checkAgg._sum.checkIns ?? 0,
  }
}

export async function listBusinessEvents(userId: string, tab?: string) {
  const b = await businessForUser(userId)
  const now = new Date()
  let where: Prisma.EventWhereInput = { businessId: b.id }
  if (tab === 'drafts') {
    where = { ...where, status: 'DRAFT' }
  } else if (tab === 'past') {
    where = {
      ...where,
      NOT: { status: 'DRAFT' },
      OR: [{ endDate: { lt: now } }, { status: 'COMPLETED' }, { status: 'CANCELLED' }],
    }
  } else {
    where = {
      ...where,
      status: 'PUBLISHED',
      isPublished: true,
      endDate: { gte: now },
    }
  }

  const rows = await prisma.event.findMany({
    where,
    orderBy: { startDate: tab === 'past' ? 'desc' : 'asc' },
    include: {
      _count: { select: { attendees: true } },
      featuredWaveLeader: {
        select: {
          id: true,
          displayName: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })
  return rows.map((r) => serializeEvent(r as any))
}

export async function getBusinessEvent(userId: string, eventId: string) {
  const b = await businessForUser(userId)
  const row = await prisma.event.findFirst({ where: { id: eventId, businessId: b.id } })
  if (!row) throw new NotFoundError('Event not found')
  return serializeEvent(row as any)
}

export async function createBusinessEvent(userId: string, input: CreateInput) {
  const b = await businessForUser(userId)
  const data = toCreateData(b.id, input)
  const row = await prisma.event.create({ data })
  return serializeEvent(row as any)
}

export async function updateBusinessEvent(userId: string, eventId: string, input: UpdateInput) {
  const b = await businessForUser(userId)
  const existing = await assertEventOwned(eventId, b.id)

  const pub = input.publishMode
    ? applyPublishMode(
        {
          publishMode: input.publishMode,
          scheduledPublishAt: input.scheduledPublishAt as Date | undefined,
        } as CreateInput,
        existing
      )
    : {}

  const patch: Prisma.EventUpdateInput = {
    ...pub,
  }

  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.category !== undefined) patch.category = input.category as EventCategory
  if (input.tags !== undefined) patch.tags = input.tags
  if (input.imageUrl !== undefined)
    patch.imageUrl = input.imageUrl === '' ? null : input.imageUrl
  if (input.highlights !== undefined) patch.highlights = input.highlights
  if (input.whatsIncluded !== undefined) patch.whatsIncluded = input.whatsIncluded
  if (input.whatToBring !== undefined) patch.whatToBring = input.whatToBring
  if (input.specialInstructions !== undefined) patch.specialInstructions = input.specialInstructions
  if (input.ageRestrictions !== undefined) patch.ageRestrictions = input.ageRestrictions
  if (input.accessibilityInfo !== undefined) patch.accessibilityInfo = input.accessibilityInfo
  if (input.startDate !== undefined) patch.startDate = new Date(input.startDate as Date)
  if (input.endDate !== undefined) patch.endDate = new Date(input.endDate as Date)
  if (input.timezone !== undefined) patch.timezone = input.timezone
  if (input.venueName !== undefined) patch.venueName = input.venueName
  if (input.address !== undefined) patch.address = input.address
  if (input.latitude !== undefined) patch.latitude = input.latitude
  if (input.longitude !== undefined) patch.longitude = input.longitude
  if (input.isVirtual !== undefined) patch.isVirtual = input.isVirtual
  if (input.virtualLink !== undefined)
    patch.virtualLink = input.virtualLink === '' ? null : input.virtualLink
  if (input.requiresRegistration !== undefined) patch.requiresRegistration = input.requiresRegistration
  if (input.maxAttendees !== undefined) patch.maxAttendees = input.maxAttendees
  if (input.registrationDeadline !== undefined)
    patch.registrationDeadline = input.registrationDeadline
      ? new Date(input.registrationDeadline as Date)
      : null
  if (input.ticketPrice !== undefined) patch.ticketPrice = input.ticketPrice
  if (input.featuredWaveLeaderId !== undefined)
    patch.featuredWaveLeaderId = input.featuredWaveLeaderId || null
  if (input.waveLeaderRate !== undefined) patch.waveLeaderRate = input.waveLeaderRate
  if (input.isFeatured !== undefined) patch.isFeatured = input.isFeatured
  if (input.scheduledPublishAt !== undefined && !input.publishMode)
    patch.scheduledPublishAt = input.scheduledPublishAt
      ? new Date(input.scheduledPublishAt as Date)
      : null

  const row = await prisma.event.update({ where: { id: eventId }, data: patch })
  return serializeEvent(row as any)
}

export async function deleteBusinessEvent(userId: string, eventId: string) {
  const b = await businessForUser(userId)
  const ev = await assertEventOwned(eventId, b.id)
  if (ev.status !== 'DRAFT') {
    throw new BadRequestError('Only draft events can be deleted')
  }
  await prisma.event.delete({ where: { id: eventId } })
  return { deleted: true }
}

export async function cancelBusinessEvent(userId: string, eventId: string) {
  const b = await businessForUser(userId)
  await assertEventOwned(eventId, b.id)
  const row = await prisma.event.update({
    where: { id: eventId },
    data: { status: 'CANCELLED', isPublished: false },
  })
  return serializeEvent(row as any)
}

export async function duplicateBusinessEvent(userId: string, eventId: string) {
  const b = await businessForUser(userId)
  const ev = await prisma.event.findFirst({
    where: { id: eventId, businessId: b.id },
  })
  if (!ev) throw new NotFoundError('Event not found')

  const row = await prisma.event.create({
    data: {
      businessId: b.id,
      title: `Copy of ${ev.title}`.slice(0, 200),
      description: ev.description,
      category: ev.category,
      tags: [...ev.tags],
      imageUrl: ev.imageUrl,
      highlights: [...ev.highlights],
      whatsIncluded: [...ev.whatsIncluded],
      whatToBring: [...ev.whatToBring],
      specialInstructions: ev.specialInstructions,
      ageRestrictions: ev.ageRestrictions,
      accessibilityInfo: ev.accessibilityInfo,
      venueName: ev.venueName,
      address: ev.address,
      latitude: ev.latitude,
      longitude: ev.longitude,
      isVirtual: ev.isVirtual,
      virtualLink: ev.virtualLink,
      startDate: ev.startDate,
      endDate: ev.endDate,
      timezone: ev.timezone,
      requiresRegistration: ev.requiresRegistration,
      maxAttendees: ev.maxAttendees,
      registrationDeadline: ev.registrationDeadline,
      ticketPrice: ev.ticketPrice,
      featuredWaveLeaderId: ev.featuredWaveLeaderId,
      waveLeaderRate: ev.waveLeaderRate,
      isFeatured: false,
      status: 'DRAFT',
      isPublished: false,
      scheduledPublishAt: null,
      views: 0,
      registrations: 0,
      checkIns: 0,
      currentAttendees: 0,
    },
  })
  return serializeEvent(row as any)
}

export async function listEventAttendees(userId: string, eventId: string) {
  const b = await businessForUser(userId)
  await assertEventOwned(eventId, b.id)
  const rows = await prisma.eventAttendee.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
    },
    orderBy: { registeredAt: 'desc' },
  })
  return rows.map((a) => ({
    id: a.id,
    eventId: a.eventId,
    userId: a.userId,
    email: a.user.email,
    firstName: a.user.firstName,
    lastName: a.user.lastName,
    avatar: a.user.avatar,
    registeredAt: a.registeredAt.toISOString(),
    ticketsPurchased: a.ticketsPurchased,
    totalPaid: a.totalPaid != null ? Number(a.totalPaid) : null,
    status: a.status,
    checkedIn: a.checkedIn,
    checkedInAt: a.checkedInAt?.toISOString() ?? null,
  }))
}

export async function checkInAttendee(
  userId: string,
  eventId: string,
  attendeeId: string,
  method: 'QR_CODE' | 'MANUAL' = 'MANUAL'
) {
  const b = await businessForUser(userId)
  await assertEventOwned(eventId, b.id)

  const attendee = await prisma.eventAttendee.findFirst({
    where: { id: attendeeId, eventId },
  })
  if (!attendee) throw new NotFoundError('Attendee not found')
  if (attendee.checkedIn) {
    return { alreadyCheckedIn: true, attendeeId }
  }

  const pointsEarned = 50

  await prisma.$transaction([
    prisma.eventAttendee.update({
      where: { id: attendeeId },
      data: { checkedIn: true, checkedInAt: new Date(), status: 'ATTENDED' },
    }),
    prisma.eventCheckIn.create({
      data: {
        eventId,
        userId: attendee.userId,
        attendeeId,
        checkInMethod: method,
        pointsEarned,
      },
    }),
    prisma.event.update({
      where: { id: eventId },
      data: { checkIns: { increment: 1 } },
    }),
    prisma.userReward.upsert({
      where: { userId: attendee.userId },
      create: {
        userId: attendee.userId,
        points: pointsEarned,
        totalEarned: pointsEarned,
      },
      update: {
        points: { increment: pointsEarned },
        totalEarned: { increment: pointsEarned },
      },
    }),
  ])

  return { checkedIn: true, attendeeId, pointsEarned }
}

/** Parse QR payload JSON or raw attendee id */
export async function checkInFromScan(userId: string, eventId: string, decodedText: string) {
  let attendeeId = decodedText.trim()
  try {
    const parsed = JSON.parse(decodedText) as { attendeeId?: string }
    if (parsed?.attendeeId) attendeeId = parsed.attendeeId
  } catch {
    /* raw id */
  }
  return checkInAttendee(userId, eventId, attendeeId, 'QR_CODE')
}

export async function removeAttendee(userId: string, eventId: string, attendeeId: string) {
  const b = await businessForUser(userId)
  await assertEventOwned(eventId, b.id)
  const row = await prisma.eventAttendee.findFirst({
    where: { id: attendeeId, eventId },
  })
  if (!row) throw new NotFoundError('Attendee not found')

  if (row.status === 'WAITLIST') {
    await prisma.eventAttendee.delete({ where: { id: attendeeId } })
    return { removed: true }
  }

  await prisma.$transaction([
    prisma.eventAttendee.delete({ where: { id: attendeeId } }),
    prisma.event.update({
      where: { id: eventId },
      data: {
        currentAttendees: { decrement: row.ticketsPurchased },
        registrations: { decrement: 1 },
      },
    }),
  ])
  return { removed: true }
}

export async function publishBusinessEvent(userId: string, eventId: string) {
  return updateBusinessEvent(userId, eventId, { publishMode: 'publish' })
}

export async function getBusinessEventAnalytics(userId: string, eventId: string) {
  const b = await businessForUser(userId)
  const ev = await prisma.event.findFirst({
    where: { id: eventId, businessId: b.id },
    select: {
      id: true,
      title: true,
      status: true,
      isPublished: true,
      startDate: true,
      endDate: true,
      views: true,
      registrations: true,
      checkIns: true,
      currentAttendees: true,
      maxAttendees: true,
      ticketPrice: true,
    },
  })
  if (!ev) throw new NotFoundError('Event not found')

  const [statusCounts, recentCheckIns, revenueAgg] = await Promise.all([
    prisma.eventAttendee.groupBy({
      by: ['status'],
      where: { eventId },
      _count: { _all: true },
    }),
    prisma.eventCheckIn.findMany({
      where: { eventId },
      orderBy: { checkedInAt: 'desc' },
      take: 15,
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
      },
    }),
    prisma.eventAttendee.aggregate({
      where: {
        eventId,
        status: { notIn: ['CANCELLED', 'WAITLIST'] },
      },
      _sum: { totalPaid: true },
    }),
  ])

  const capacity =
    ev.maxAttendees != null ? Math.max(0, ev.maxAttendees - ev.currentAttendees) : null

  const revenue = Number(revenueAgg._sum.totalPaid ?? 0)
  const ticketPriceNum =
    ev.ticketPrice != null ? Number(ev.ticketPrice) : 0
  const revenueEstimate =
    ticketPriceNum > 0 ? ticketPriceNum * ev.currentAttendees : 0

  return {
    event: {
      id: ev.id,
      title: ev.title,
      status: ev.status,
      isPublished: ev.isPublished,
      startDate: ev.startDate.toISOString(),
      endDate: ev.endDate.toISOString(),
      views: ev.views,
      registrations: ev.registrations,
      checkIns: ev.checkIns,
      currentAttendees: ev.currentAttendees,
      maxAttendees: ev.maxAttendees,
      spotsRemaining: capacity,
      checkInRate:
        ev.registrations > 0 ? Math.round((ev.checkIns / ev.registrations) * 1000) / 10 : 0,
      revenue,
      revenueEstimate,
    },
    registrationsByStatus: statusCounts.map((r) => ({
      status: r.status,
      count: r._count._all,
    })),
    recentCheckIns: recentCheckIns.map((c) => ({
      id: c.id,
      checkedInAt: c.checkedInAt.toISOString(),
      method: c.checkInMethod,
      user: {
        firstName: c.user.firstName,
        lastName: c.user.lastName,
        avatar: c.user.avatar,
      },
    })),
  }
}
