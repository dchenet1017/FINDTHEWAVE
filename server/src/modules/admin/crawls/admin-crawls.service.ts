import type { CrawlStatus, Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma'
import { NotFoundError, BadRequestError } from '../../../utils/errors'
import type { z } from 'zod'
import type {
  createBusinessCrawlSchema,
  updateBusinessCrawlSchema,
} from '../../business/business-crawls.schema'

type CreateInput = z.infer<typeof createBusinessCrawlSchema>
type UpdateInput = z.infer<typeof updateBusinessCrawlSchema>

const stopInclude = {
  stops: {
    orderBy: { order: 'asc' as const },
    include: { business: { select: { id: true, name: true, latitude: true, longitude: true } } },
  },
} satisfies Prisma.CrawlInclude

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

export async function listAllCrawls(status?: string) {
  const where: Prisma.CrawlWhereInput = status ? { status: status as CrawlStatus } : {}
  const rows = await prisma.crawl.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: {
      ...stopInclude,
      hostBusiness: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { attendees: true } },
    },
  })
  return rows.map((r) => serializeCrawl(r))
}

export async function getCrawl(id: string) {
  const row = await prisma.crawl.findUnique({
    where: { id },
    include: {
      ...stopInclude,
      hostBusiness: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { attendees: true } },
    },
  })
  if (!row) throw new NotFoundError('Crawl not found')
  return serializeCrawl(row)
}

export async function createCrawl(adminUserId: string, input: CreateInput) {
  const stops = await resolveStops(input.stopBusinessIds)
  const publish = input.publishMode === 'publish'

  const row = await prisma.crawl.create({
    data: {
      createdByUser: { connect: { id: adminUserId } },
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

export async function updateCrawl(id: string, input: UpdateInput) {
  const existing = await prisma.crawl.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Crawl not found')

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
      prisma.crawlStop.deleteMany({ where: { crawlId: id } }),
      prisma.crawl.update({ where: { id }, data: { ...patch, stops: { create: stops } } }),
    ])
  } else {
    await prisma.crawl.update({ where: { id }, data: patch })
  }

  const row = await prisma.crawl.findUniqueOrThrow({ where: { id }, include: stopInclude })
  return serializeCrawl(row)
}

export async function publishCrawl(id: string) {
  return updateCrawl(id, { publishMode: 'publish' } as UpdateInput)
}

export async function cancelCrawl(id: string) {
  const existing = await prisma.crawl.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Crawl not found')
  const row = await prisma.crawl.update({
    where: { id },
    data: { status: 'CANCELLED', isPublished: false },
    include: stopInclude,
  })
  return serializeCrawl(row)
}

export async function deleteCrawl(id: string) {
  const existing = await prisma.crawl.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Crawl not found')
  if (existing.status !== 'DRAFT') {
    throw new BadRequestError('Only draft crawls can be deleted')
  }
  await prisma.crawl.delete({ where: { id } })
  return { deleted: true }
}
