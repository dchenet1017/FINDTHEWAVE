import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { Prisma } from '@prisma/client'

const EARTH_RADIUS_MILES = 3958.8

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MILES * c
}

export interface ListWaveLeadersFilters {
  page?: number
  limit?: number
  specialty?: string
  minRate?: number
  maxRate?: number
  minRating?: number
  availableNow?: boolean
  verifiedOnly?: boolean
  lat?: number
  lng?: number
  radiusMiles?: number
  sortBy?: 'rating' | 'hourlyRate' | 'createdAt' | 'distance'
  sortOrder?: 'asc' | 'desc'
  search?: string
}

function toPublicWaveLeader(wl: any, distance?: number) {
  return {
    id: wl.id,
    displayName: wl.displayName,
    specialty: wl.specialty,
    description: wl.description,
    hourlyRate: Number(wl.hourlyRate),
    rating: Number(wl.rating),
    totalReviews: wl.totalReviews,
    isAvailable: wl.isAvailable,
    isVerified: wl.isVerified,
    location: wl.location,
    latitude: wl.latitude != null ? Number(wl.latitude) : null,
    longitude: wl.longitude != null ? Number(wl.longitude) : null,
    avatar: wl.user?.avatar ?? null,
    distance,
  }
}

export async function listWaveLeaders(filters: ListWaveLeadersFilters) {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(50, Math.max(1, filters.limit ?? 12))
  const skip = (page - 1) * limit

  const where: Prisma.WaveLeaderWhereInput = {
    isVerified: true,
    latitude: { not: null },
    longitude: { not: null },
  }

  if (filters.specialty && filters.specialty !== 'all') {
    where.specialty = { contains: filters.specialty, mode: 'insensitive' }
  }

  if (filters.minRate != null && filters.minRate > 0) {
    where.hourlyRate = { gte: filters.minRate }
  }
  if (filters.maxRate != null && filters.maxRate > 0) {
    where.hourlyRate = { ...(where.hourlyRate as object), lte: filters.maxRate }
  }

  if (filters.minRating != null && filters.minRating > 0) {
    where.rating = { gte: filters.minRating }
  }

  if (filters.availableNow) {
    where.isAvailable = true
  }

  if (filters.verifiedOnly) {
    where.isVerified = true
  }

  if (filters.search && filters.search.trim().length >= 2) {
    where.OR = [
      { displayName: { contains: filters.search.trim(), mode: 'insensitive' } },
      { specialty: { contains: filters.search.trim(), mode: 'insensitive' } },
    ]
  }

  const hasGeo = filters.lat != null && filters.lng != null && filters.radiusMiles != null
  const takeSize = hasGeo ? 500 : limit
  const skipSize = hasGeo ? 0 : skip

  const rawList = await prisma.waveLeader.findMany({
    where,
    skip: skipSize,
    take: takeSize,
    orderBy:
      filters.sortBy === 'rating'
        ? { rating: filters.sortOrder === 'asc' ? 'asc' : 'desc' }
        : filters.sortBy === 'hourlyRate'
          ? { hourlyRate: filters.sortOrder === 'asc' ? 'asc' : 'desc' }
          : { createdAt: filters.sortOrder === 'asc' ? 'asc' : 'desc' },
    include: {
      user: { select: { avatar: true } },
    },
  })

  let list = rawList.map((wl) => toPublicWaveLeader(wl))

  if (hasGeo) {
    const radius = filters.radiusMiles ?? 50
    list = list
      .map((wl) => ({
        ...wl,
        distance: haversineMiles(
          filters.lat!,
          filters.lng!,
          wl.latitude!,
          wl.longitude!
        ),
      }))
      .filter((wl) => (wl.distance ?? 0) <= radius)
    if (filters.sortBy === 'distance') {
      list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      if (filters.sortOrder === 'desc') list.reverse()
    }
  }

  const total = hasGeo ? list.length : await prisma.waveLeader.count({ where })
  const paginatedList = hasGeo ? list.slice(skip, skip + limit) : list

  return {
    waveLeaders: paginatedList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getNearbyWaveLeaders(
  lat: number,
  lng: number,
  radiusMiles: number,
  limit = 20
) {
  const waveLeaders = await prisma.waveLeader.findMany({
    where: {
      isVerified: true,
      isAvailable: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    take: limit * 2,
    include: { user: { select: { avatar: true } } },
  })

  const withDistance = waveLeaders
    .filter((wl) => wl.latitude != null && wl.longitude != null)
    .map((wl) => ({
      ...toPublicWaveLeader(wl),
      distance: haversineMiles(lat, lng, Number(wl.latitude), Number(wl.longitude)),
    }))
    .filter((wl) => wl.distance! <= radiusMiles)
    .sort((a, b) => a.distance! - b.distance!)
    .slice(0, limit)

  return withDistance
}

export async function searchWaveLeaders(q: string, limit = 20) {
  if (!q || q.trim().length < 2) {
    return []
  }

  const waveLeaders = await prisma.waveLeader.findMany({
    where: {
      isVerified: true,
      OR: [
        { displayName: { contains: q.trim(), mode: 'insensitive' } },
        { specialty: { contains: q.trim(), mode: 'insensitive' } },
      ],
    },
    take: limit,
    include: { user: { select: { avatar: true } } },
  })

  return waveLeaders.map((wl) => toPublicWaveLeader(wl))
}

export async function getAvailability(id: string) {
  const wl = await prisma.waveLeader.findUnique({
    where: { id },
    select: { isAvailable: true },
  })
  if (!wl) throw new NotFoundError('WaveLeader not found')
  return { isAvailable: wl.isAvailable }
}
