import { prisma } from '../../lib/prisma'
import { CheckInMethod } from '@prisma/client'
import { NotFoundError, BadRequestError } from '../../utils/errors'

const CHECK_IN_RADIUS_METERS = 100 // 100 meters
const BASE_POINTS = 10
const STREAK_BONUS_POINTS = 5 // Bonus points for consecutive days

/**
 * Calculate distance between two points using Haversine formula
 * @returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Check if user is within check-in radius
 */
function isWithinRange(
  userLat: number,
  userLng: number,
  businessLat: number,
  businessLng: number,
  radiusMeters: number = CHECK_IN_RADIUS_METERS
): boolean {
  const distance = calculateDistance(userLat, userLng, businessLat, businessLng)
  return distance <= radiusMeters
}

/**
 * Calculate check-in streak
 */
async function calculateStreak(userId: string): Promise<number> {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30, // Check last 30 days
  })

  if (checkIns.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < checkIns.length; i++) {
    const checkInDate = new Date(checkIns[i].createdAt)
    checkInDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === i) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * Check if user already checked in today
 */
async function hasCheckedInToday(userId: string, businessId: string): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const checkIn = await prisma.checkIn.findFirst({
    where: {
      userId,
      businessId,
      createdAt: {
        gte: today,
      },
    },
  })

  return !!checkIn
}

/**
 * Award points to user
 */
async function awardPoints(userId: string, basePoints: number, streak: number): Promise<number> {
  const pointsEarned = basePoints + (streak > 1 ? STREAK_BONUS_POINTS : 0)

  // Update user's reward points
  await prisma.userReward.upsert({
    where: { userId },
    create: {
      userId,
      points: pointsEarned,
      totalEarned: pointsEarned,
      level: 1,
    },
    update: {
      points: {
        increment: pointsEarned,
      },
      totalEarned: {
        increment: pointsEarned,
      },
    },
  })

  return pointsEarned
}

export const checkInService = {
  /**
   * Check if user can check in
   */
  async canCheckIn(
    userId: string,
    businessId: string,
    userLat?: number,
    userLng?: number
  ) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!business) {
      throw new NotFoundError('Business not found')
    }

    if (!business.latitude || !business.longitude) {
      return {
        canCheckIn: false,
        reason: 'Business location not available',
      }
    }

    // Check if already checked in today
    const alreadyCheckedIn = await hasCheckedInToday(userId, businessId)
    if (alreadyCheckedIn) {
      const lastCheckIn = await prisma.checkIn.findFirst({
        where: {
          userId,
          businessId,
        },
        orderBy: { createdAt: 'desc' },
      })

      return {
        canCheckIn: false,
        reason: 'Already checked in today',
        lastCheckIn: lastCheckIn?.createdAt.toISOString(),
      }
    }

    // Check distance if location provided
    if (userLat !== undefined && userLng !== undefined) {
      const withinRange = isWithinRange(
        userLat,
        userLng,
        business.latitude,
        business.longitude
      )

      if (!withinRange) {
        const distance = calculateDistance(
          userLat,
          userLng,
          business.latitude,
          business.longitude
        )

        return {
          canCheckIn: false,
          reason: 'Too far away',
          distance: Math.round(distance),
        }
      }
    }

    return {
      canCheckIn: true,
    }
  },

  /**
   * Perform check-in
   */
  async checkIn(
    userId: string,
    businessId: string,
    method: CheckInMethod = 'GEOFENCE',
    userLat?: number,
    userLng?: number
  ) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!business) {
      throw new NotFoundError('Business not found')
    }

    if (!business.latitude || !business.longitude) {
      throw new BadRequestError('Business location not available')
    }

    // Validate distance if location provided
    if (userLat !== undefined && userLng !== undefined) {
      const withinRange = isWithinRange(
        userLat,
        userLng,
        business.latitude,
        business.longitude
      )

      if (!withinRange) {
        const distance = calculateDistance(
          userLat,
          userLng,
          business.latitude,
          business.longitude
        )
        throw new BadRequestError(
          `You are too far away (${Math.round(distance)}m). Please move closer to check in.`
        )
      }
    }

    // Check if already checked in today
    const alreadyCheckedIn = await hasCheckedInToday(userId, businessId)
    if (alreadyCheckedIn) {
      throw new BadRequestError('You have already checked in at this location today')
    }

    // Calculate streak
    const streak = await calculateStreak(userId)

    // Award points
    const pointsEarned = await awardPoints(userId, BASE_POINTS, streak)

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        businessId,
        method,
        points: pointsEarned,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    })

    // Get total points
    const userReward = await prisma.userReward.findUnique({
      where: { userId },
      select: { points: true },
    })

    const totalPoints = userReward?.points || 0

    return {
      checkIn: {
        id: checkIn.id,
        businessId: checkIn.businessId,
        method: checkIn.method,
        points: checkIn.points,
        createdAt: checkIn.createdAt.toISOString(),
      },
      pointsEarned,
      totalPoints,
      streak: streak + 1, // +1 for current check-in
    }
  },

  /**
   * Get user's check-in history
   */
  async getCheckInHistory(userId: string, limit: number = 100) {
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            type: true,
            logo: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return checkIns
  },

  /**
   * Get unique check-in locations
   */
  async getCheckInLocations(userId: string) {
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            type: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get unique locations
    const locationMap = new Map()
    checkIns.forEach((checkIn) => {
      if (checkIn.business.latitude && checkIn.business.longitude) {
        const key = `${checkIn.business.latitude},${checkIn.business.longitude}`
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            id: checkIn.business.id,
            name: checkIn.business.name,
            latitude: checkIn.business.latitude,
            longitude: checkIn.business.longitude,
            type: checkIn.business.type,
            city: checkIn.business.city,
            state: checkIn.business.state,
            checkInCount: 0,
            lastCheckIn: checkIn.createdAt,
          })
        }
        const location = locationMap.get(key)
        location.checkInCount++
        if (checkIn.createdAt > location.lastCheckIn) {
          location.lastCheckIn = checkIn.createdAt
        }
      }
    })

    return Array.from(locationMap.values())
  },
}

