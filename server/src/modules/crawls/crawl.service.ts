import type { CrawlStatus, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { calculateDistanceMiles } from '../events/event.utils'
import * as crawlRegistration from './crawl.registration.service'

const publicCrawlWhere: Prisma.CrawlWhereInput = {
  isPublished: true,
  status: 'PUBLISHED',
}

const stopBusinessSelect = {
  id: true,
  name: true,
  type: true,
  address: true,
  city: true,
  latitude: true,
  longitude: true,
  images: true,
} as const

const hostBusinessSelect = { id: true, name: true, city: true, address: true, type: true } as const

const listInclude = {
  hostBusiness: { select: hostBusinessSelect },
  createdByUser: { select: { id: true, firstName: true, lastName: true } },
  stops: {
    orderBy: { order: 'asc' as const },
    include: { business: { select: stopBusinessSelect } },
  },
  _count: { select: { attendees: true } },
} satisfies Prisma.CrawlInclude

export type ListCrawlsQuery = {
  search?: string
  dateFrom?: string
  dateTo?: string
  sort?: 'soon' | 'popular' | 'recent'
  page?: number
  limit?: number
}

function serializeCrawl<T extends Record<string, unknown>>(row: T) {
  const o = { ...row } as any
  if (o.startDate) o.startDate = new Date(o.startDate).toISOString()
  if (o.endDate) o.endDate = new Date(o.endDate).toISOString()
  if (o.createdAt) o.createdAt = new Date(o.createdAt).toISOString()
  if (o.updatedAt) o.updatedAt = new Date(o.updatedAt).toISOString()
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

function buildWhere(q: ListCrawlsQuery): Prisma.CrawlWhereInput {
  const and: Prisma.CrawlWhereInput[] = [{ ...publicCrawlWhere }]

  if (q.search?.trim()) {
    const s = q.search.trim()
    and.push({
      OR: [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ],
    })
  }

  if (q.dateFrom || q.dateTo) {
    const from = q.dateFrom ? new Date(q.dateFrom) : undefined
    const to = q.dateTo ? new Date(q.dateTo) : undefined
    if (from && to) {
      and.push({ AND: [{ startDate: { lte: to } }, { endDate: { gte: from } }] })
    } else if (from) {
      and.push({ endDate: { gte: from } })
    } else if (to) {
      and.push({ startDate: { lte: to } })
    }
  }

  return { AND: and }
}

export async function listCrawls(q: ListCrawlsQuery) {
  const page = Math.max(1, q.page ?? 1)
  const limit = Math.min(100, Math.max(1, q.limit ?? 24))
  const skip = (page - 1) * limit
  const where = buildWhere(q)

  let orderBy: Prisma.CrawlOrderByWithRelationInput[] = [{ startDate: 'asc' }]
  if (q.sort === 'popular') orderBy = [{ currentAttendees: 'desc' }]
  else if (q.sort === 'recent') orderBy = [{ createdAt: 'desc' }]

  const [total, rows] = await Promise.all([
    prisma.crawl.count({ where }),
    prisma.crawl.findMany({ where, include: listInclude, orderBy, skip, take: limit }),
  ])

  return {
    items: rows.map((r) => serializeCrawl(r)),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

/** A crawl's anchor location for distance purposes is its first stop's business location. */
function anchorLocation(stops: { order: number; business: { latitude: unknown; longitude: unknown } }[]) {
  const first = [...stops].sort((a, b) => a.order - b.order)[0]
  if (!first?.business) return null
  const lat = Number(first.business.latitude)
  const lng = Number(first.business.longitude)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  return { lat, lng }
}

export async function nearbyCrawls(lat: number, lng: number, radius: number, limit = 40) {
  const now = new Date()
  const rows = await prisma.crawl.findMany({
    where: { ...publicCrawlWhere, startDate: { gte: now } },
    include: listInclude,
    orderBy: { startDate: 'asc' },
    take: 200,
  })

  const withDist = rows
    .map((r) => {
      const anchor = anchorLocation(r.stops as any)
      if (!anchor) return null
      const d = calculateDistanceMiles(lat, lng, anchor.lat, anchor.lng)
      return { r, d }
    })
    .filter((x): x is { r: (typeof rows)[0]; d: number } => x != null && x.d <= radius)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)

  return withDist.map((x) => ({
    ...serializeCrawl(x.r),
    distanceMiles: Math.round(x.d * 10) / 10,
  }))
}

export async function getCrawlById(id: string) {
  const row = await prisma.crawl.findFirst({
    where: { id, isPublished: true, status: 'PUBLISHED' },
    include: listInclude,
  })
  if (!row) return null
  return serializeCrawl(row)
}

export async function bumpCrawlViews(_id: string) {
  // No view counter on Crawl yet; reserved for future analytics parity with Event.
}

// ——— Facade API (used by crawl.controller) ———

export async function getCrawls(filters: ListCrawlsQuery) {
  return listCrawls(filters)
}

export async function getNearbyCrawls(lat: number, lng: number, radius = 10, limit = 40) {
  const items = await nearbyCrawls(lat, lng, radius, limit)
  return { items }
}

export function getRegistration(crawlId: string, userId: string) {
  return crawlRegistration.getMyRegistration(crawlId, userId)
}

export function registerForCrawl(crawlId: string, userId: string) {
  return crawlRegistration.registerForCrawl(crawlId, userId)
}

export function cancelRegistration(crawlId: string, userId: string) {
  return crawlRegistration.cancelRegistration(crawlId, userId)
}
