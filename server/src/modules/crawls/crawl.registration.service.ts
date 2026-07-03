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
  crawlId: string
  userId: string
  registeredAt: Date
  status: string
  completedAt: Date | null
  bonusAwarded: boolean
}) {
  return {
    id: row.id,
    crawlId: row.crawlId,
    userId: row.userId,
    registeredAt: row.registeredAt.toISOString(),
    status: row.status,
    completedAt: row.completedAt?.toISOString() ?? null,
    bonusAwarded: row.bonusAwarded,
    qrPayload: JSON.stringify({ attendeeId: row.id, crawlId: row.crawlId }),
  }
}

export async function getMyRegistration(crawlId: string, userId: string) {
  const row = await prisma.crawlAttendee.findUnique({
    where: { crawlId_userId: { crawlId, userId } },
  })
  if (!row) return null
  if (row.status === 'CANCELLED') return null
  return serializeAttendee(row)
}

export async function registerForCrawl(crawlId: string, userId: string) {
  const crawl = await prisma.crawl.findFirst({
    where: { id: crawlId, isPublished: true, status: 'PUBLISHED' },
  })
  if (!crawl) {
    throw new RegistrationError('NOT_FOUND', 'Crawl not found')
  }

  const existing = await prisma.crawlAttendee.findUnique({
    where: { crawlId_userId: { crawlId, userId } },
  })
  if (existing && existing.status !== 'CANCELLED') {
    throw new RegistrationError('ALREADY_REGISTERED', 'You are already registered for this crawl')
  }

  const max = crawl.maxAttendees
  const spotsLeft = max == null ? Infinity : Math.max(0, max - crawl.currentAttendees)
  if (spotsLeft <= 0) {
    throw new RegistrationError('SOLD_OUT', 'This crawl is full')
  }

  await prisma.$transaction(async (tx) => {
    const c = await tx.crawl.findUnique({ where: { id: crawlId } })
    if (!c || !c.isPublished || c.status !== 'PUBLISHED') {
      throw new RegistrationError('NOT_FOUND', 'Crawl not found')
    }
    const left = c.maxAttendees == null ? Infinity : Math.max(0, c.maxAttendees - c.currentAttendees)
    if (left <= 0) {
      throw new RegistrationError('SOLD_OUT', 'This crawl is full')
    }

    if (existing) {
      await tx.crawlAttendee.update({
        where: { id: existing.id },
        data: { status: 'REGISTERED', registeredAt: new Date(), completedAt: null, bonusAwarded: false },
      })
    } else {
      await tx.crawlAttendee.create({ data: { crawlId, userId, status: 'REGISTERED' } })
    }
    await tx.crawl.update({
      where: { id: crawlId },
      data: { currentAttendees: { increment: 1 } },
    })
  })

  const reg = await getMyRegistration(crawlId, userId)
  return reg!
}

export async function cancelRegistration(crawlId: string, userId: string) {
  const row = await prisma.crawlAttendee.findUnique({
    where: { crawlId_userId: { crawlId, userId } },
  })
  if (!row || row.status === 'CANCELLED') {
    throw new RegistrationError('NOT_REGISTERED', 'No registration found')
  }

  await prisma.$transaction(async (tx) => {
    await tx.crawlAttendee.update({ where: { id: row.id }, data: { status: 'CANCELLED' } })
    await tx.crawl.update({
      where: { id: crawlId },
      data: { currentAttendees: { decrement: 1 } },
    })
  })

  return { cancelled: true }
}
