import { prisma } from '../../lib/prisma'
import { BadRequestError } from '../../utils/errors'
import { haversineMiles } from '../../lib/geo'

const DEFAULT_RADIUS_MILES = 10

function serializeStatus(row: {
  id: string
  userId: string
  isActive: boolean
  latitude: number
  longitude: number
  activatedAt: Date
  expiresAt: Date
}) {
  const isLive = row.isActive && row.expiresAt.getTime() > Date.now()
  return {
    id: row.id,
    userId: row.userId,
    isActive: isLive,
    latitude: row.latitude,
    longitude: row.longitude,
    activatedAt: row.activatedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  }
}

export async function activate(userId: string, lat: number, lng: number, durationMinutes: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new BadRequestError('Valid latitude and longitude are required')
  }
  const duration = Math.min(480, Math.max(15, durationMinutes || 120))
  const expiresAt = new Date(Date.now() + duration * 60 * 1000)

  const row = await prisma.goOutStatus.upsert({
    where: { userId },
    create: { userId, isActive: true, latitude: lat, longitude: lng, expiresAt },
    update: { isActive: true, latitude: lat, longitude: lng, activatedAt: new Date(), expiresAt },
  })
  return serializeStatus(row)
}

export async function deactivate(userId: string) {
  const existing = await prisma.goOutStatus.findUnique({ where: { userId } })
  if (!existing) return { isActive: false }
  const row = await prisma.goOutStatus.update({ where: { userId }, data: { isActive: false } })
  return serializeStatus(row)
}

export async function getStatus(userId: string) {
  const row = await prisma.goOutStatus.findUnique({ where: { userId } })
  if (!row) return { isActive: false, latitude: null, longitude: null, expiresAt: null }
  return serializeStatus(row)
}

/**
 * Active "going out" users near a given point. Business/Admin only.
 * Businesses default to their own location; admins (no Business row) must pass lat/lng explicitly.
 */
export async function getNearby(
  requestingUserId: string,
  radiusMiles = DEFAULT_RADIUS_MILES,
  overrideLat?: number,
  overrideLng?: number
) {
  let bizLat = overrideLat
  let bizLng = overrideLng

  if (bizLat == null || bizLng == null) {
    const business = await prisma.business.findUnique({ where: { userId: requestingUserId } })
    if (!business) {
      throw new BadRequestError('lat and lng are required (no business location on file)')
    }
    bizLat = Number(business.latitude)
    bizLng = Number(business.longitude)
  }

  const rows = await prisma.goOutStatus.findMany({
    where: { isActive: true, expiresAt: { gt: new Date() } },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  })

  return rows
    .map((r) => ({
      ...r,
      distanceMiles: haversineMiles(bizLat, bizLng, r.latitude, r.longitude),
    }))
    .filter((r) => r.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .map((r) => ({
      goOutStatusId: r.id,
      userId: r.userId,
      user: r.user,
      distanceMiles: Math.round(r.distanceMiles * 10) / 10,
      activatedAt: r.activatedAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }))
}
