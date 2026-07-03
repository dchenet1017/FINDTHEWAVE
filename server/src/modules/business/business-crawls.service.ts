import type { CrawlStatus, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, BadRequestError } from '../../utils/errors'
import type { z } from 'zod'
import type { createBusinessCrawlSchema, updateBusinessCrawlSchema } from './business-crawls.schema'

type CreateInput = z.infer<typeof createBusinessCrawlSchema>
type UpdateInput = z.infer<typeof updateBusinessCrawlSchema>

const STOP_CHECKIN_BASE_POINTS = 10

const stopInclude = {
  stops: {
    orderBy: { order: 'asc' as const },
    include: { business: { select: { id: true, name: true, latitude: true, longitude: true } } },
  },
} satisfies Prisma.CrawlInclude

async function businessForUser(userId: string) {
  const business = await prisma.business.findUnique({ where: { userId } })
  if (!business) throw new NotFoundError('Business not found for this user')
  return business
}

function serializeCrawl(row: Record<string, unknown>) {
  const o = { ...row } as any
  ;['startDate', 'endDate', 'createdAt', 'updatedAt'].forEach((k) => {
    if (o[k] != null) o[k] = new Date(o[k]).toISOString()
  })
  if (Array.isArray(o.stops)) {
    o.stops = o.stops.map((s: any) => ({
      ...s,
      business: s.business
        ? {
            ...s.business,
            latitude: s.business.latitude != null ? Number(s.business.latitude) : null,
            longitude: s.business.longitude != null ? Number(s.business.longitude) : null,
          }
        : null,
    }))
  }
  return o
}

async function assertCrawlHostedBy(crawlId: string, businessId: string) {
  const crawl = await prisma.crawl.findFirst({ where: { id: crawlId, hostBusinessId: businessId } })
  if (!crawl) throw new NotFoundError('Crawl not found')
  return crawl
}

async function resolveStops(stopBusinessIds: string[]) {
  const businesses = await prisma.business.findMany({
    where: { id: { in: stopBusinessIds } },
    select: { id: true },
  })
  if (businesses.length !== new Set(stopBusinessIds).size) {
    throw new BadRequestError('One or more stop businesses could not be found')
  }
  return stopBusinessIds.map((businessId, i) => ({ businessId, order: i + 1 }))
}

export async function getBusinessCrawlStats(userId: string) {
  const b = await businessForUser(userId)
  const now = new Date()
  const [totalCrawls, upcomingCrawls, draftCrawls, attendeeAgg] = await Promise.all([
    prisma.crawl.count({ where: { hostBusinessId: b.id } }),
    prisma.crawl.count({
      where: { hostBusinessId: b.id, status: 'PUBLISHED', isPublished: true, endDate: { gte: now } },
    }),
    prisma.crawl.count({ where: { hostBusinessId: b.id, status: 'DRAFT' } }),
    prisma.crawl.aggregate({ where: { hostBusinessId: b.id }, _sum: { currentAttendees: true } }),
  ])
  return {
    totalCrawls,
    upcomingCrawls,
    draftCrawls,
    totalAttendees: attendeeAgg._sum.currentAttendees ?? 0,
  }
}

export async function listBusinessCrawls(userId: string, tab?: string) {
  const b = await businessForUser(userId)
  const now = new Date()
  let where: Prisma.CrawlWhereInput = { hostBusinessId: b.id }
  if (tab === 'drafts') {
    where = { ...where, status: 'DRAFT' }
  } else if (tab === 'past') {
    where = {
      ...where,
      NOT: { status: 'DRAFT' },
      OR: [{ endDate: { lt: now } }, { status: 'COMPLETED' }, { status: 'CANCELLED' }],
    }
  } else {
    where = { ...where, status: 'PUBLISHED', isPublished: true, endDate: { gte: now } }
  }

  const rows = await prisma.crawl.findMany({
    where,
    orderBy: { startDate: tab === 'past' ? 'desc' : 'asc' },
    include: { ...stopInclude, _count: { select: { attendees: true } } },
  })
  return rows.map((r) => serializeCrawl(r))
}

export async function getBusinessCrawl(userId: string, crawlId: string) {
  const b = await businessForUser(userId)
  const row = await prisma.crawl.findFirst({
    where: { id: crawlId, hostBusinessId: b.id },
    include: { ...stopInclude, _count: { select: { attendees: true } } },
  })
  if (!row) throw new NotFoundError('Crawl not found')
  return serializeCrawl(row)
}

export async function createBusinessCrawl(userId: string, input: CreateInput) {
  const b = await businessForUser(userId)
  const stops = await resolveStops(input.stopBusinessIds)
  const publish = input.publishMode === 'publish'

  const row = await prisma.crawl.create({
    data: {
      hostBusiness: { connect: { id: b.id } },
      title: input.title,
      description: input.description || '',
      imageUrl: input.imageUrl || null,
      startDate: new Date(input.startDate as Date),
      endDate: new Date(input.endDate as Date),
      maxAttendees: input.maxAttendees ?? null,
      bonusPoints: input.bonusPoints ?? 50,
      status: publish ? 'PUBLISHED' : 'DRAFT',
      isPublished: publish,
      stops: { create: stops },
    },
    include: stopInclude,
  })
  return serializeCrawl(row)
}

export async function updateBusinessCrawl(userId: string, crawlId: string, input: UpdateInput) {
  const b = await businessForUser(userId)
  await assertCrawlHostedBy(crawlId, b.id)

  const patch: Prisma.CrawlUpdateInput = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl || null
  if (input.startDate !== undefined) patch.startDate = new Date(input.startDate as Date)
  if (input.endDate !== undefined) patch.endDate = new Date(input.endDate as Date)
  if (input.maxAttendees !== undefined) patch.maxAttendees = input.maxAttendees
  if (input.bonusPoints !== undefined) patch.bonusPoints = input.bonusPoints
  if (input.publishMode !== undefined) {
    patch.status = input.publishMode === 'publish' ? 'PUBLISHED' : 'DRAFT'
    patch.isPublished = input.publishMode === 'publish'
  }

  if (input.stopBusinessIds !== undefined) {
    const stops = await resolveStops(input.stopBusinessIds)
    await prisma.$transaction([
      prisma.crawlStop.deleteMany({ where: { crawlId } }),
      prisma.crawl.update({
        where: { id: crawlId },
        data: { ...patch, stops: { create: stops } },
      }),
    ])
  } else {
    await prisma.crawl.update({ where: { id: crawlId }, data: patch })
  }

  const row = await prisma.crawl.findUniqueOrThrow({ where: { id: crawlId }, include: stopInclude })
  return serializeCrawl(row)
}

export async function deleteBusinessCrawl(userId: string, crawlId: string) {
  const b = await businessForUser(userId)
  const crawl = await assertCrawlHostedBy(crawlId, b.id)
  if (crawl.status !== 'DRAFT') {
    throw new BadRequestError('Only draft crawls can be deleted')
  }
  await prisma.crawl.delete({ where: { id: crawlId } })
  return { deleted: true }
}

export async function publishBusinessCrawl(userId: string, crawlId: string) {
  return updateBusinessCrawl(userId, crawlId, { publishMode: 'publish' } as UpdateInput)
}

export async function cancelBusinessCrawl(userId: string, crawlId: string) {
  const b = await businessForUser(userId)
  await assertCrawlHostedBy(crawlId, b.id)
  const row = await prisma.crawl.update({
    where: { id: crawlId },
    data: { status: 'CANCELLED', isPublished: false },
    include: stopInclude,
  })
  return serializeCrawl(row)
}

export async function duplicateBusinessCrawl(userId: string, crawlId: string) {
  const b = await businessForUser(userId)
  const crawl = await prisma.crawl.findFirst({
    where: { id: crawlId, hostBusinessId: b.id },
    include: { stops: { orderBy: { order: 'asc' } } },
  })
  if (!crawl) throw new NotFoundError('Crawl not found')

  const row = await prisma.crawl.create({
    data: {
      hostBusinessId: b.id,
      title: `Copy of ${crawl.title}`.slice(0, 200),
      description: crawl.description,
      imageUrl: crawl.imageUrl,
      startDate: crawl.startDate,
      endDate: crawl.endDate,
      maxAttendees: crawl.maxAttendees,
      bonusPoints: crawl.bonusPoints,
      status: 'DRAFT',
      isPublished: false,
      currentAttendees: 0,
      stops: {
        create: crawl.stops.map((s) => ({ businessId: s.businessId, order: s.order })),
      },
    },
    include: stopInclude,
  })
  return serializeCrawl(row)
}

export async function listCrawlAttendees(userId: string, crawlId: string) {
  const b = await businessForUser(userId)
  await assertCrawlHostedBy(crawlId, b.id)
  const rows = await prisma.crawlAttendee.findMany({
    where: { crawlId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
      stopCheckIns: { select: { crawlStopId: true, checkedInAt: true } },
    },
    orderBy: { registeredAt: 'desc' },
  })
  return rows.map((a) => ({
    id: a.id,
    crawlId: a.crawlId,
    userId: a.userId,
    email: a.user.email,
    firstName: a.user.firstName,
    lastName: a.user.lastName,
    avatar: a.user.avatar,
    registeredAt: a.registeredAt.toISOString(),
    status: a.status,
    completedAt: a.completedAt?.toISOString() ?? null,
    bonusAwarded: a.bonusAwarded,
    stopsCompleted: a.stopCheckIns.length,
  }))
}

/** Stops the requesting business owns, across all crawls — for the "stops I check in at" view. */
export async function listMyStops(userId: string) {
  const b = await businessForUser(userId)
  const rows = await prisma.crawlStop.findMany({
    where: { businessId: b.id },
    include: {
      crawl: { select: { id: true, title: true, startDate: true, endDate: true, status: true } },
    },
    orderBy: { crawl: { startDate: 'asc' } },
  })
  return rows.map((s) => ({
    stopId: s.id,
    crawlId: s.crawlId,
    order: s.order,
    crawl: {
      ...s.crawl,
      startDate: s.crawl.startDate.toISOString(),
      endDate: s.crawl.endDate.toISOString(),
    },
  }))
}

async function assertStopOwnedByBusiness(crawlId: string, stopId: string, businessId: string) {
  const stop = await prisma.crawlStop.findFirst({ where: { id: stopId, crawlId, businessId } })
  if (!stop) throw new NotFoundError('Stop not found for this business')
  return stop
}

export async function checkInAtStop(
  userId: string,
  crawlId: string,
  stopId: string,
  attendeeId: string,
  method: 'QR_CODE' | 'MANUAL' = 'MANUAL'
) {
  const b = await businessForUser(userId)
  await assertStopOwnedByBusiness(crawlId, stopId, b.id)

  const attendee = await prisma.crawlAttendee.findFirst({ where: { id: attendeeId, crawlId } })
  if (!attendee) throw new NotFoundError('Attendee not found')
  if (attendee.status === 'CANCELLED') throw new BadRequestError('This registration was cancelled')

  const existingCheckIn = await prisma.crawlStopCheckIn.findUnique({
    where: { crawlStopId_attendeeId: { crawlStopId: stopId, attendeeId } },
  })
  if (existingCheckIn) {
    return { alreadyCheckedIn: true, attendeeId }
  }

  await prisma.$transaction([
    prisma.crawlStopCheckIn.create({
      data: { crawlStopId: stopId, attendeeId, userId: attendee.userId, pointsEarned: STOP_CHECKIN_BASE_POINTS },
    }),
    prisma.userReward.upsert({
      where: { userId: attendee.userId },
      create: { userId: attendee.userId, points: STOP_CHECKIN_BASE_POINTS, totalEarned: STOP_CHECKIN_BASE_POINTS },
      update: {
        points: { increment: STOP_CHECKIN_BASE_POINTS },
        totalEarned: { increment: STOP_CHECKIN_BASE_POINTS },
      },
    }),
  ])

  const [totalStops, completedStops] = await Promise.all([
    prisma.crawlStop.count({ where: { crawlId } }),
    prisma.crawlStopCheckIn.count({ where: { attendeeId } }),
  ])

  let bonusAwarded = false
  if (completedStops >= totalStops && !attendee.bonusAwarded) {
    const crawl = await prisma.crawl.findUniqueOrThrow({ where: { id: crawlId } })
    await prisma.$transaction([
      prisma.crawlAttendee.update({
        where: { id: attendeeId },
        data: { status: 'COMPLETED', completedAt: new Date(), bonusAwarded: true },
      }),
      prisma.userReward.upsert({
        where: { userId: attendee.userId },
        create: { userId: attendee.userId, points: crawl.bonusPoints, totalEarned: crawl.bonusPoints },
        update: {
          points: { increment: crawl.bonusPoints },
          totalEarned: { increment: crawl.bonusPoints },
        },
      }),
    ])
    bonusAwarded = true
  }

  return {
    checkedIn: true,
    attendeeId,
    pointsEarned: STOP_CHECKIN_BASE_POINTS,
    stopsCompleted: completedStops,
    totalStops,
    bonusAwarded,
  }
}

/** Parse QR payload JSON or raw attendee id */
export async function checkInFromScan(
  userId: string,
  crawlId: string,
  stopId: string,
  decodedText: string
) {
  let attendeeId = decodedText.trim()
  try {
    const parsed = JSON.parse(decodedText) as { attendeeId?: string }
    if (parsed?.attendeeId) attendeeId = parsed.attendeeId
  } catch {
    /* raw id */
  }
  return checkInAtStop(userId, crawlId, stopId, attendeeId, 'QR_CODE')
}
