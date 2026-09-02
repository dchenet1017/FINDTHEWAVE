import { prisma } from '../../lib/prisma'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors'
import { haversineMiles } from '../../lib/geo'
import {
  DEFAULT_INTENT_MINUTES,
  DEFAULT_OFFER_MINUTES,
  VIBES,
  type RespondOfferInput,
  type SendOfferInput,
  type Vibe,
} from './go-out.schema'

const MILES_TO_METERS = 1609.344

let postgisEnabled = false
async function ensurePostgis() {
  if (postgisEnabled) return
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis')
    postgisEnabled = true
  } catch (err) {
    console.error('PostGIS enable failed, falling back to haversine:', err)
  }
}

interface NearbyIntentRow {
  id: string
  userId: string
  vibes: string[]
  partySize: number
  createdAt: Date
  expiresAt: Date
  distanceMiles: number
}

/**
 * Active intents within `radiusMiles` of a point.
 *
 * PostGIS does the distance work (the same ST_MakePoint(...)::geography approach
 * as business.service.ts, since no model in this schema stores a geometry
 * column), with a bounding-box + haversine fallback for databases without the
 * extension.
 *
 * Internal only - these rows carry userId, so never hand them to a business
 * caller without aggregating first.
 */
async function findNearbyIntents(
  lat: number,
  lng: number,
  radiusMiles: number
): Promise<NearbyIntentRow[]> {
  await ensurePostgis()
  const now = new Date()

  if (postgisEnabled) {
    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
      SELECT
        i."id", i."userId", i."vibes", i."partySize", i."createdAt", i."expiresAt",
        ST_Distance(
          ST_MakePoint(i."longitude"::float, i."latitude"::float)::geography,
          ST_MakePoint($1, $2)::geography
        ) / ${MILES_TO_METERS} AS "distanceMiles"
      FROM "GoOutIntent" i
      WHERE i."status" = 'ACTIVE'
        AND i."expiresAt" > NOW()
        AND ST_DWithin(
          ST_MakePoint(i."longitude"::float, i."latitude"::float)::geography,
          ST_MakePoint($1, $2)::geography,
          $3
        )
      ORDER BY "distanceMiles" ASC
    `,
        lng,
        lat,
        radiusMiles * MILES_TO_METERS
      )

      return rows.map((r) => ({
        ...r,
        partySize: Number(r.partySize),
        distanceMiles:
          typeof r.distanceMiles === 'string'
            ? parseFloat(r.distanceMiles)
            : r.distanceMiles,
      }))
    } catch (err) {
      console.error('PostGIS demand query failed, falling back to haversine:', err)
    }
  }

  // Fallback: rough bounding box, then an exact haversine filter.
  const deg = radiusMiles / 69.0
  const candidates = await prisma.goOutIntent.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { gt: now },
      latitude: { gte: lat - deg, lte: lat + deg },
      longitude: { gte: lng - deg, lte: lng + deg },
    },
    select: {
      id: true,
      userId: true,
      vibes: true,
      partySize: true,
      createdAt: true,
      expiresAt: true,
      latitude: true,
      longitude: true,
    },
  })

  return candidates
    .map((c) => ({
      id: c.id,
      userId: c.userId,
      vibes: c.vibes,
      partySize: c.partySize,
      createdAt: c.createdAt,
      expiresAt: c.expiresAt,
      distanceMiles: haversineMiles(lat, lng, c.latitude, c.longitude),
    }))
    .filter((c) => c.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
}

/** Lazily retire intents and offers whose window has passed. */
async function expireStale() {
  const now = new Date()
  await prisma.goOutIntent.updateMany({
    where: { status: 'ACTIVE', expiresAt: { lte: now } },
    data: { status: 'EXPIRED' },
  })
  await prisma.businessOffer.updateMany({
    where: { status: 'PENDING', expiresAt: { lte: now } },
    data: { status: 'EXPIRED' },
  })
}

function serializeIntent(row: {
  id: string
  status: string
  vibes: string[]
  partySize: number
  latitude: number
  longitude: number
  createdAt: Date
  expiresAt: Date
}) {
  return {
    id: row.id,
    status: row.status,
    vibes: row.vibes,
    partySize: row.partySize,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  }
}

/** The business identity a user is allowed to see on an offer. */
const offerBusinessSelect = {
  id: true,
  name: true,
  type: true,
  address: true,
  latitude: true,
  longitude: true,
} as const

function serializeOffer(row: any, opts: { includeDoorCode: boolean }) {
  return {
    id: row.id,
    intentId: row.intentId,
    message: row.message,
    perkDescription: row.perkDescription,
    // A door code is a physical access credential - only release it once the
    // user has actually accepted.
    doorCode: opts.includeDoorCode ? (row.doorCode ?? null) : null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
    business: row.business
      ? {
          id: row.business.id,
          name: row.business.name,
          type: row.business.type,
          address: row.business.address ?? null,
          latitude: row.business.latitude != null ? Number(row.business.latitude) : null,
          longitude: row.business.longitude != null ? Number(row.business.longitude) : null,
        }
      : null,
  }
}

async function requireBusiness(userId: string) {
  const business = await prisma.business.findUnique({ where: { userId } })
  if (!business) {
    throw new ForbiddenError('No business profile is linked to this account')
  }
  return business
}

/** POST /raise-hand */
export async function raiseHand(
  userId: string,
  input: {
    vibes: Vibe[]
    partySize: number
    latitude: number
    longitude: number
    durationMinutes?: number
  }
) {
  await expireStale()

  // One live hand per user: replace rather than stack.
  await prisma.goOutIntent.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: { status: 'EXPIRED' },
  })

  const minutes = input.durationMinutes ?? DEFAULT_INTENT_MINUTES
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000)

  const intent = await prisma.goOutIntent.create({
    data: {
      userId,
      vibes: input.vibes,
      partySize: input.partySize,
      latitude: input.latitude,
      longitude: input.longitude,
      expiresAt,
    },
  })

  return serializeIntent(intent)
}

/** DELETE /lower-hand */
export async function lowerHand(userId: string) {
  const active = await prisma.goOutIntent.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })

  if (!active) {
    throw new BadRequestError('You do not have a hand raised right now')
  }

  const updated = await prisma.goOutIntent.update({
    where: { id: active.id },
    data: { status: 'EXPIRED' },
  })

  // Offers that were waiting on this intent are moot now.
  await prisma.businessOffer.updateMany({
    where: { intentId: active.id, status: 'PENDING' },
    data: { status: 'EXPIRED' },
  })

  return serializeIntent(updated)
}

/**
 * GET /my-intent
 * The caller's own live intent plus how many other hands are up nearby - an
 * aggregate count only, never who they are.
 */
export async function getMyIntent(userId: string) {
  await expireStale()

  const intent = await prisma.goOutIntent.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'CLAIMED'] } },
    orderBy: { createdAt: 'desc' },
  })

  if (!intent) return { intent: null, nearbyCount: 0 }

  const nearby = await findNearbyIntents(intent.latitude, intent.longitude, 10)

  return {
    intent: serializeIntent(intent),
    // Everyone else with a hand up within 10 miles.
    nearbyCount: nearby.filter((n) => n.userId !== userId).length,
  }
}

const DISTANCE_BUCKETS = [
  { label: 'Under 1 mi', min: 0, max: 1 },
  { label: '1-3 mi', min: 1, max: 3 },
  { label: '3-5 mi', min: 3, max: 5 },
  { label: '5+ mi', min: 5, max: Infinity },
]

/**
 * GET /active-demand - business only.
 *
 * Returns counts only. No userId, name, avatar or coordinate ever leaves this
 * function, so a venue can size the crowd without identifying anyone in it.
 */
export async function getActiveDemand(
  requestingUserId: string,
  radiusMiles: number,
  overrideLat?: number,
  overrideLng?: number
) {
  await expireStale()

  let lat = overrideLat
  let lng = overrideLng

  if (lat == null || lng == null) {
    const business = await prisma.business.findUnique({
      where: { userId: requestingUserId },
    })
    if (!business) {
      throw new BadRequestError('lat and lng are required (no business location on file)')
    }
    lat = Number(business.latitude)
    lng = Number(business.longitude)
  }

  const intents = await findNearbyIntents(lat, lng, radiusMiles)

  const byVibe = VIBES.map((vibe) => ({
    vibe,
    count: intents.filter((i) => i.vibes.includes(vibe)).length,
  })).filter((v) => v.count > 0)

  const byPartySize = [1, 2, 3, 4, 5]
    .map((size) => ({
      partySize: size,
      label: size === 1 ? 'Just me' : size >= 5 ? '5+' : String(size),
      count: intents.filter((i) =>
        size >= 5 ? i.partySize >= 5 : i.partySize === size
      ).length,
    }))
    .filter((p) => p.count > 0)

  const byDistance = DISTANCE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: intents.filter(
      (i) => i.distanceMiles >= bucket.min && i.distanceMiles < bucket.max
    ).length,
  })).filter((b) => b.count > 0)

  return {
    radiusMiles,
    /** Hands raised */
    totalIntents: intents.length,
    /** Seats, i.e. party sizes summed */
    totalPeople: intents.reduce((sum, i) => sum + i.partySize, 0),
    byVibe,
    byPartySize,
    byDistance,
  }
}

/**
 * POST /send-offer - business only.
 *
 * Fans out one offer per matching intent, or posts a single open offer when
 * `broadcast` is set.
 */
export async function sendOffer(requestingUserId: string, input: SendOfferInput) {
  await expireStale()
  const business = await requireBusiness(requestingUserId)

  const expiresAt = new Date(
    Date.now() + (input.expiresInMinutes ?? DEFAULT_OFFER_MINUTES) * 60 * 1000
  )

  const base = {
    businessId: business.id,
    message: input.message,
    perkDescription: input.perkDescription,
    doorCode: input.doorCode || null,
    expiresAt,
  }

  if (input.broadcast) {
    const offer = await prisma.businessOffer.create({
      data: { ...base, intentId: null },
      include: { business: { select: offerBusinessSelect } },
    })
    return {
      broadcast: true,
      offersCreated: 1,
      matchedIntents: 0,
      offer: serializeOffer(offer, { includeDoorCode: true }),
    }
  }

  const lat = Number(business.latitude)
  const lng = Number(business.longitude)
  const nearby = await findNearbyIntents(lat, lng, input.radiusMiles)

  const matches = input.vibes?.length
    ? nearby.filter((i) => i.vibes.some((v) => input.vibes!.includes(v as Vibe)))
    : nearby

  if (matches.length === 0) {
    return { broadcast: false, offersCreated: 0, matchedIntents: 0, offer: null }
  }

  // Don't queue a second pending offer from the same venue for one intent.
  const existing = await prisma.businessOffer.findMany({
    where: {
      businessId: business.id,
      intentId: { in: matches.map((m) => m.id) },
      status: 'PENDING',
    },
    select: { intentId: true },
  })
  const alreadyOffered = new Set(existing.map((e) => e.intentId))
  const targets = matches.filter((m) => !alreadyOffered.has(m.id))

  const created = await prisma.businessOffer.createMany({
    data: targets.map((t) => ({ ...base, intentId: t.id })),
  })

  return {
    broadcast: false,
    offersCreated: created.count,
    matchedIntents: matches.length,
    offer: null,
  }
}

/** How far a venue's open broadcast reaches. */
const BROADCAST_RADIUS_MILES = 10

/**
 * GET /my-offers
 * Offers waiting on the caller's live intent, plus open broadcasts from venues
 * within reach of it.
 */
export async function getMyOffers(userId: string) {
  await expireStale()

  const intent = await prisma.goOutIntent.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'CLAIMED'] } },
    orderBy: { createdAt: 'desc' },
  })

  if (!intent) return { intentId: null, offers: [] }

  const targeted = await prisma.businessOffer.findMany({
    where: { intentId: intent.id },
    include: { business: { select: offerBusinessSelect } },
    orderBy: { createdAt: 'desc' },
  })

  // Unclaimed broadcasts, narrowed to venues actually near this intent.
  const broadcasts = await prisma.businessOffer.findMany({
    where: { intentId: null, status: 'PENDING', expiresAt: { gt: new Date() } },
    include: { business: { select: offerBusinessSelect } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const nearbyBroadcasts = broadcasts.filter((o) => {
    if (o.business?.latitude == null || o.business?.longitude == null) return false
    return (
      haversineMiles(
        intent.latitude,
        intent.longitude,
        Number(o.business.latitude),
        Number(o.business.longitude)
      ) <= BROADCAST_RADIUS_MILES
    )
  })

  const offers = [...targeted, ...nearbyBroadcasts]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((o) => serializeOffer(o, { includeDoorCode: o.status === 'ACCEPTED' }))

  return { intentId: intent.id, offers }
}

/** POST /respond-offer/:offerId */
export async function respondToOffer(
  userId: string,
  offerId: string,
  input: RespondOfferInput
) {
  await expireStale()

  const intent = await prisma.goOutIntent.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'CLAIMED'] } },
    orderBy: { createdAt: 'desc' },
  })

  if (!intent) {
    throw new BadRequestError('You need a raised hand to respond to an offer')
  }

  const offer = await prisma.businessOffer.findUnique({
    where: { id: offerId },
    include: { business: { select: offerBusinessSelect } },
  })

  if (!offer) throw new NotFoundError('Offer not found')

  // Targeted offers belong to one intent; broadcasts are open until claimed.
  if (offer.intentId && offer.intentId !== intent.id) {
    throw new ForbiddenError('This offer was not sent to you')
  }

  if (offer.status !== 'PENDING') {
    throw new BadRequestError(`This offer is already ${offer.status.toLowerCase()}`)
  }

  if (offer.expiresAt.getTime() <= Date.now()) {
    await prisma.businessOffer.update({
      where: { id: offer.id },
      data: { status: 'EXPIRED' },
    })
    throw new BadRequestError('This offer has expired')
  }

  if (input.action === 'DECLINE') {
    const updated = await prisma.businessOffer.update({
      where: { id: offer.id },
      // Claim the row on decline too, so a declined broadcast stops coming back.
      data: { status: 'DECLINED', respondedAt: new Date(), intentId: intent.id },
      include: { business: { select: offerBusinessSelect } },
    })
    return {
      offer: serializeOffer(updated, { includeDoorCode: false }),
      intent: serializeIntent(intent),
    }
  }

  // Accept: claim the offer and the intent together, so a broadcast cannot be
  // taken twice and the user stops receiving new offers.
  const [updatedOffer, updatedIntent] = await prisma.$transaction([
    prisma.businessOffer.update({
      where: { id: offer.id },
      data: { status: 'ACCEPTED', respondedAt: new Date(), intentId: intent.id },
      include: { business: { select: offerBusinessSelect } },
    }),
    prisma.goOutIntent.update({
      where: { id: intent.id },
      data: { status: 'CLAIMED' },
    }),
    // Other venues' pending offers for this intent are no longer live.
    prisma.businessOffer.updateMany({
      where: { intentId: intent.id, status: 'PENDING', id: { not: offer.id } },
      data: { status: 'EXPIRED' },
    }),
  ])

  return {
    offer: serializeOffer(updatedOffer, { includeDoorCode: true }),
    intent: serializeIntent(updatedIntent),
  }
}

/** GET /sent-offers - business only, for the demand panel's recent activity. */
export async function getSentOffers(requestingUserId: string) {
  await expireStale()
  const business = await requireBusiness(requestingUserId)

  const offers = await prisma.businessOffer.findMany({
    where: { businessId: business.id },
    include: { business: { select: offerBusinessSelect } },
    orderBy: { createdAt: 'desc' },
    take: 25,
  })

  return {
    offers: offers.map((o) => serializeOffer(o, { includeDoorCode: true })),
  }
}

/**
 * GET /active-venues
 *
 * Business ids with at least one live offer on the table, for the map's
 * "actively competing" badge. Ids only - this says a venue is running an offer,
 * never who it went to.
 */
export async function getActiveOfferVenueIds() {
  await expireStale()

  const rows = await prisma.businessOffer.findMany({
    where: { status: 'PENDING', expiresAt: { gt: new Date() } },
    select: { businessId: true },
    distinct: ['businessId'],
    take: 500,
  })

  return { businessIds: rows.map((r) => r.businessId) }
}
