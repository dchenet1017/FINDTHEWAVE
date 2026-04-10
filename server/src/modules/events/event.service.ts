import type { EventCategory, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { calculateDistanceMiles } from './event.utils'
import * as eventRegistration from './event.registration.service'

const publicEventWhere: Prisma.EventWhereInput = {
  isPublished: true,
  status: 'PUBLISHED',
}

/** Fields included on public list / nearby / similar responses */
const businessListSelect = {
  id: true,
  name: true,
  city: true,
  address: true,
  type: true,
  rating: true,
} as const

const waveLeaderSelect = { id: true, displayName: true, specialty: true }

const listInclude = {
  business: { select: businessListSelect },
  featuredWaveLeader: { select: waveLeaderSelect },
  _count: { select: { attendees: true } },
} satisfies Prisma.EventInclude

const waveLeaderDetailSelect = {
  id: true,
  displayName: true,
  specialty: true,
  description: true,
  hourlyRate: true,
  rating: true,
  totalReviews: true,
  totalBookings: true,
  isVerified: true,
  portfolioImages: true,
  tags: true,
  user: { select: { firstName: true, lastName: true, avatar: true } },
}

export type ListEventsQuery = {
  search?: string
  category?: EventCategory | ''
  /** Overlap-style window (event intersects range) */
  dateFrom?: string
  dateTo?: string
  /** Additional bounds: event.startDate >= startDate */
  startDate?: string
  /** Additional bounds: event.endDate <= endDate */
  endDate?: string
  freeOnly?: boolean
  hasWaveLeader?: boolean
  virtualOnly?: boolean
  minPrice?: number
  maxPrice?: number
  lat?: number
  lng?: number
  /** Search radius in miles (haversine filter; not PostGIS). */
  radius?: number
  minSpotsLeft?: number
  sort?: 'soon' | 'popular' | 'nearest' | 'recent'
  page?: number
  limit?: number
  /** Cursor-style offset; if set, overrides (page - 1) * limit for skip. */
  offset?: number
}

function serializeEvent<T extends Record<string, unknown>>(row: T) {
  const o = { ...row } as any
  if (o.ticketPrice != null) o.ticketPrice = Number(o.ticketPrice)
  if (o.waveLeaderRate != null) o.waveLeaderRate = Number(o.waveLeaderRate)
  if (o.startDate) o.startDate = new Date(o.startDate).toISOString()
  if (o.endDate) o.endDate = new Date(o.endDate).toISOString()
  if (o.registrationDeadline)
    o.registrationDeadline = new Date(o.registrationDeadline).toISOString()
  if (o.business && typeof o.business === 'object' && (o.business as any).rating != null) {
    o.business = {
      ...(o.business as object),
      rating: Number((o.business as any).rating),
    }
  }
  return o
}

function buildWhere(q: ListEventsQuery): Prisma.EventWhereInput {
  const and: Prisma.EventWhereInput[] = [{ ...publicEventWhere }]

  if (q.category) {
    and.push({ category: q.category as EventCategory })
  }

  if (q.search?.trim()) {
    const s = q.search.trim()
    and.push({
      OR: [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { tags: { hasSome: [s.toLowerCase(), s] } },
      ],
    })
  }

  if (q.dateFrom || q.dateTo) {
    const from = q.dateFrom ? new Date(q.dateFrom) : undefined
    const to = q.dateTo ? new Date(q.dateTo) : undefined
    if (from && to) {
      and.push({
        AND: [{ startDate: { lte: to } }, { endDate: { gte: from } }],
      })
    } else if (from) {
      and.push({ endDate: { gte: from } })
    } else if (to) {
      and.push({ startDate: { lte: to } })
    }
  }

  if (q.startDate) {
    and.push({ startDate: { gte: new Date(q.startDate) } })
  }
  if (q.endDate) {
    and.push({ endDate: { lte: new Date(q.endDate) } })
  }

  if (q.freeOnly) {
    and.push({
      OR: [{ ticketPrice: null }, { ticketPrice: 0 }],
    })
  }

  if (q.hasWaveLeader) {
    and.push({ featuredWaveLeaderId: { not: null } })
  }

  if (q.virtualOnly) {
    and.push({ isVirtual: true })
  }

  if (!q.freeOnly && (q.minPrice != null || q.maxPrice != null)) {
    const priceParts: Prisma.EventWhereInput[] = [{ ticketPrice: { not: null } }]
    if (q.minPrice != null) priceParts.push({ ticketPrice: { gte: q.minPrice } })
    if (q.maxPrice != null) priceParts.push({ ticketPrice: { lte: q.maxPrice } })
    and.push({ AND: priceParts })
  }

  return { AND: and }
}

function spotsLeft(e: { maxAttendees: number | null; currentAttendees: number }) {
  if (e.maxAttendees == null) return Infinity
  return Math.max(0, e.maxAttendees - e.currentAttendees)
}

export async function listEvents(q: ListEventsQuery) {
  const page = Math.max(1, q.page ?? 1)
  const limit = Math.min(100, Math.max(1, q.limit ?? 24))
  const offsetBase =
    q.offset != null && !Number.isNaN(q.offset) ? Math.max(0, q.offset) : (page - 1) * limit
  const where = buildWhere(q)

  let orderBy: Prisma.EventOrderByWithRelationInput[] = [{ startDate: 'asc' }]
  if (q.sort === 'popular') {
    orderBy = [{ registrations: 'desc' }, { views: 'desc' }]
  } else if (q.sort === 'recent') {
    orderBy = [{ createdAt: 'desc' }]
  } else if (q.sort === 'soon' || !q.sort) {
    orderBy = [{ startDate: 'asc' }]
  }

  const needsMemoryPass =
    (q.minSpotsLeft != null && q.minSpotsLeft > 0) ||
    (q.lat != null && q.lng != null && q.radius != null && q.radius > 0) ||
    q.sort === 'nearest'

  if (!needsMemoryPass) {
    const [total, rows] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        include: listInclude,
        orderBy,
        skip: offsetBase,
        take: limit,
      }),
    ])
    const items = rows.map((e) => serializeEvent(e))
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      offset: offsetBase,
    }
  }

  const rows = await prisma.event.findMany({
    where,
    include: listInclude,
    orderBy,
    take: 500,
  })

  let filtered = rows

  if (q.minSpotsLeft != null && q.minSpotsLeft > 0) {
    filtered = filtered.filter((e) => spotsLeft(e) >= q.minSpotsLeft!)
  }

  if (q.lat != null && q.lng != null && q.radius != null && q.radius > 0) {
    filtered = filtered.filter(
      (e) =>
        calculateDistanceMiles(q.lat!, q.lng!, e.latitude, e.longitude) <= q.radius!
    )
  }

  if (q.sort === 'nearest' && q.lat != null && q.lng != null) {
    filtered = [...filtered].sort(
      (a, b) =>
        calculateDistanceMiles(q.lat!, q.lng!, a.latitude, a.longitude) -
        calculateDistanceMiles(q.lat!, q.lng!, b.latitude, b.longitude)
    )
  }

  const total = filtered.length
  const slice = filtered.slice(offsetBase, offsetBase + limit)
  const items = slice.map((e) => serializeEvent(e))

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    offset: offsetBase,
  }
}

export async function nearbyEvents(lat: number, lng: number, radius: number, limit = 40) {
  const now = new Date()
  const rows = await prisma.event.findMany({
    where: {
      ...publicEventWhere,
      startDate: { gte: now },
    },
    include: {
      business: { select: businessListSelect },
      featuredWaveLeader: { select: waveLeaderSelect },
    },
    orderBy: { startDate: 'asc' },
    take: 300,
  })

  const withDist = rows
    .map((e) => ({
      e,
      d: calculateDistanceMiles(lat, lng, e.latitude, e.longitude),
    }))
    .filter((x) => x.d <= radius)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)

  return withDist.map((x) => ({
    ...serializeEvent(x.e),
    distanceMiles: Math.round(x.d * 10) / 10,
  }))
}

export async function featuredEvents(limit = 12) {
  const now = new Date()
  const rows = await prisma.event.findMany({
    where: {
      ...publicEventWhere,
      isFeatured: true,
      startDate: { gte: now },
    },
    include: {
      business: { select: businessListSelect },
      featuredWaveLeader: { select: waveLeaderSelect },
      _count: { select: { attendees: true } },
    },
    orderBy: { startDate: 'asc' },
    take: limit,
  })
  return rows.map((e) => serializeEvent(e))
}

export async function getEventById(id: string) {
  const row = await prisma.event.findFirst({
    where: {
      id,
      isPublished: true,
      status: 'PUBLISHED',
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          type: true,
          rating: true,
          description: true,
          latitude: true,
          longitude: true,
          phone: true,
          website: true,
        },
      },
      featuredWaveLeader: { select: waveLeaderDetailSelect },
      _count: { select: { attendees: true } },
    },
  })
  if (!row) return null
  const e = serializeEvent(row) as typeof row
  if (e.business) {
    ;(e.business as any).latitude = row.business.latitude != null ? Number(row.business.latitude) : null
    ;(e.business as any).longitude = row.business.longitude != null ? Number(row.business.longitude) : null
    ;(e.business as any).rating =
      row.business.rating != null ? Number(row.business.rating) : 0
  }
  if (e.featuredWaveLeader) {
    const wl = row.featuredWaveLeader
    if (wl) {
      ;(e.featuredWaveLeader as any).hourlyRate =
        wl.hourlyRate != null ? Number(wl.hourlyRate) : null
      ;(e.featuredWaveLeader as any).rating = wl.rating != null ? Number(wl.rating) : 0
    }
  }
  return e
}

export async function bumpEventViews(id: string) {
  await prisma.event
    .updateMany({
      where: { id, isPublished: true, status: 'PUBLISHED' },
      data: { views: { increment: 1 } },
    })
    .catch(() => {})
}

export async function getSimilarEvents(eventId: string, limit = 4) {
  const evt = await prisma.event.findFirst({
    where: { id: eventId, ...publicEventWhere },
    select: { id: true, category: true, businessId: true },
  })
  if (!evt) return []

  const now = new Date()
  const rows = await prisma.event.findMany({
    where: {
      ...publicEventWhere,
      id: { not: eventId },
      OR: [{ category: evt.category }, { businessId: evt.businessId }],
      startDate: { gte: now },
    },
    include: {
      business: { select: businessListSelect },
      featuredWaveLeader: { select: waveLeaderSelect },
      _count: { select: { attendees: true } },
    },
    take: 24,
    orderBy: { startDate: 'asc' },
  })

  const scored = [...rows].sort((a, b) => {
    const score = (x: (typeof rows)[0]) =>
      (x.category === evt.category ? 2 : 0) + (x.businessId === evt.businessId ? 1 : 0)
    return score(b) - score(a)
  })

  return scored.slice(0, limit).map((r) => serializeEvent(r))
}

// ——— Facade API (used by event.controller) ———

export async function getEvents(filters: ListEventsQuery) {
  return listEvents(filters)
}

export async function getFeaturedEvents(limit = 12) {
  const items = await featuredEvents(limit)
  return { items }
}

export async function getNearbyEvents(lat: number, lng: number, radius = 10, limit = 40) {
  const items = await nearbyEvents(lat, lng, radius, limit)
  return { items }
}

export function getRegistration(eventId: string, userId: string) {
  return eventRegistration.getMyRegistration(eventId, userId)
}

export async function registerForEvent(
  eventId: string,
  userId: string,
  tickets: number,
  opts?: { waitlist?: boolean }
) {
  if (opts?.waitlist) {
    return eventRegistration.joinWaitlist(eventId, userId, tickets)
  }
  return eventRegistration.registerForEvent(eventId, userId, tickets)
}

export function cancelRegistration(eventId: string, userId: string) {
  return eventRegistration.cancelRegistration(eventId, userId)
}

export const incrementEventViews = bumpEventViews
