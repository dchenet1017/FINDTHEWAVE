import { prisma } from '../../../lib/prisma'
import { NotFoundError, BadRequestError } from '../../../utils/errors'

const DAY_MS = 24 * 60 * 60 * 1000

/** "Jordan S." - enough for an admin to tell people apart, no more. */
function displayName(user: { firstName: string | null; lastName: string | null } | null) {
  if (!user?.firstName) return 'Anonymous'
  return user.lastName ? `${user.firstName} ${user.lastName[0]}.` : user.firstName
}

/**
 * Pilot oversight for the go-out queue: what demand looks like right now, what
 * venues are sending, and how it converts.
 *
 * Intent coordinates are rounded to ~1 km before they leave this function. An
 * admin needs to see where demand clusters, not where a person is standing.
 */
export async function getOverview() {
  const now = new Date()
  const since = new Date(now.getTime() - DAY_MS)

  const [activeIntents, offers24h, recentIntents, recentOffers] = await Promise.all([
    prisma.goOutIntent.findMany({
      where: { status: 'ACTIVE', expiresAt: { gt: now } },
      select: { partySize: true, vibes: true },
    }),
    prisma.businessOffer.findMany({
      // Private DECLINED copies of broadcasts are responses, not offers sent
      where: { createdAt: { gte: since }, sourceOfferId: null },
      select: { status: true, businessId: true, intentId: true },
    }),
    prisma.goOutIntent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { offers: true } },
      },
    }),
    prisma.businessOffer.findMany({
      where: { sourceOfferId: null },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: { business: { select: { id: true, name: true } } },
    }),
  ])

  // Declines of broadcasts live on as private copies, so count them separately
  const broadcastDeclines24h = await prisma.businessOffer.count({
    where: { createdAt: { gte: since }, sourceOfferId: { not: null } },
  })

  const byVibe = new Map<string, number>()
  for (const intent of activeIntents) {
    for (const vibe of intent.vibes) byVibe.set(vibe, (byVibe.get(vibe) ?? 0) + 1)
  }

  const accepted24h = offers24h.filter((o) => o.status === 'ACCEPTED').length
  const declined24h =
    offers24h.filter((o) => o.status === 'DECLINED').length + broadcastDeclines24h

  // Per-venue funnel over the last 24h
  const venueIds = [...new Set(offers24h.map((o) => o.businessId))]
  const venues = venueIds.length
    ? await prisma.business.findMany({
        where: { id: { in: venueIds } },
        select: { id: true, name: true },
      })
    : []
  const venueName = new Map(venues.map((v) => [v.id, v.name]))
  const venueStats = venueIds
    .map((id) => {
      const mine = offers24h.filter((o) => o.businessId === id)
      return {
        businessId: id,
        name: venueName.get(id) ?? 'Unknown venue',
        sent: mine.length,
        accepted: mine.filter((o) => o.status === 'ACCEPTED').length,
      }
    })
    .sort((a, b) => b.accepted - a.accepted || b.sent - a.sent)

  return {
    live: {
      handsRaised: activeIntents.length,
      people: activeIntents.reduce((sum, i) => sum + i.partySize, 0),
      groupsOf3Plus: activeIntents.filter((i) => i.partySize >= 3).length,
      byVibe: [...byVibe.entries()]
        .map(([vibe, count]) => ({ vibe, count }))
        .sort((a, b) => b.count - a.count),
    },
    last24h: {
      offersSent: offers24h.length,
      accepted: accepted24h,
      declined: declined24h,
      // Share of answered offers that were accepted
      acceptanceRate:
        accepted24h + declined24h > 0 ? accepted24h / (accepted24h + declined24h) : null,
    },
    venues: venueStats,
    recentIntents: recentIntents.map((i) => ({
      id: i.id,
      who: displayName(i.user),
      status: i.status === 'ACTIVE' && i.expiresAt <= now ? 'EXPIRED' : i.status,
      vibes: i.vibes,
      partySize: i.partySize,
      approxLatitude: Math.round(i.latitude * 100) / 100,
      approxLongitude: Math.round(i.longitude * 100) / 100,
      offersReceived: i._count.offers,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
    })),
    recentOffers: recentOffers.map((o) => ({
      id: o.id,
      business: o.business,
      broadcast: o.intentId === null,
      message: o.message,
      perkDescription: o.perkDescription,
      status: o.status === 'PENDING' && o.expiresAt <= now ? 'EXPIRED' : o.status,
      createdAt: o.createdAt.toISOString(),
      expiresAt: o.expiresAt.toISOString(),
      respondedAt: o.respondedAt?.toISOString() ?? null,
    })),
  }
}

/**
 * Pull a live offer, e.g. one that is inappropriate or was sent by mistake.
 * Recorded as EXPIRED, which every user and venue view already understands.
 */
export async function withdrawOffer(offerId: string) {
  const offer = await prisma.businessOffer.findUnique({ where: { id: offerId } })
  if (!offer) throw new NotFoundError('Offer not found')

  const { count } = await prisma.businessOffer.updateMany({
    where: { id: offerId, status: 'PENDING' },
    data: { status: 'EXPIRED', respondedAt: new Date() },
  })
  if (count === 0) {
    throw new BadRequestError(`This offer is already ${offer.status.toLowerCase()}`)
  }
  return { id: offerId, status: 'EXPIRED' as const }
}
