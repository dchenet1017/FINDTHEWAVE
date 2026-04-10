import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, BadRequestError } from '../../utils/errors'
import { bookingStartMs } from '../bookings/bookings.service'
import { hash } from 'bcryptjs'

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phone?: string | null
  bio?: string | null
}

export interface UserSettings {
  privacy?: {
    profileVisibility?: 'public' | 'private'
    showCheckInHistory?: boolean
    allowLocationTracking?: boolean
  }
  notifications?: {
    email?: {
      bookingConfirmations?: boolean
      bookingReminders?: boolean
      promotionalOffers?: boolean
      weeklyDigest?: boolean
    }
    push?: {
      nearbyDeals?: boolean
      checkInReminders?: boolean
      newWaveLeaders?: boolean
    }
  }
  preferences?: {
    defaultMapView?: 'map' | 'satellite' | 'hybrid'
    distanceUnit?: 'miles' | 'kilometers'
    theme?: 'dark' | 'light' | 'system'
    language?: string
  }
}

/** Shape event + nested business for client EventCard / ticket UIs */
function serializeUserEventRow(ev: Record<string, any>) {
  const ticketPrice = ev.ticketPrice != null ? Number(ev.ticketPrice) : null
  const waveLeaderRate = ev.waveLeaderRate != null ? Number(ev.waveLeaderRate) : null
  const scheduled =
    ev.scheduledPublishAt != null
      ? new Date(ev.scheduledPublishAt).toISOString()
      : null
  const regDeadline =
    ev.registrationDeadline != null
      ? new Date(ev.registrationDeadline).toISOString()
      : null

  const base = {
    id: ev.id,
    businessId: ev.businessId,
    title: ev.title,
    description: ev.description,
    imageUrl: ev.imageUrl ?? null,
    category: ev.category,
    tags: ev.tags ?? [],
    highlights: ev.highlights ?? [],
    whatsIncluded: ev.whatsIncluded ?? [],
    whatToBring: ev.whatToBring ?? [],
    specialInstructions: ev.specialInstructions ?? null,
    ageRestrictions: ev.ageRestrictions ?? null,
    accessibilityInfo: ev.accessibilityInfo ?? null,
    scheduledPublishAt: scheduled,
    venueName: ev.venueName ?? null,
    address: ev.address ?? null,
    latitude: Number(ev.latitude),
    longitude: Number(ev.longitude),
    isVirtual: Boolean(ev.isVirtual),
    virtualLink: ev.virtualLink ?? null,
    startDate: new Date(ev.startDate).toISOString(),
    endDate: new Date(ev.endDate).toISOString(),
    timezone: ev.timezone,
    requiresRegistration: Boolean(ev.requiresRegistration),
    maxAttendees: ev.maxAttendees ?? null,
    currentAttendees: ev.currentAttendees,
    registrationDeadline: regDeadline,
    ticketPrice,
    featuredWaveLeaderId: ev.featuredWaveLeaderId ?? null,
    waveLeaderRate,
    status: ev.status,
    isPublished: ev.isPublished,
    isFeatured: ev.isFeatured,
    views: ev.views,
    registrations: ev.registrations,
    checkIns: ev.checkIns,
  }

  const result: Record<string, unknown> = { ...base }
  if (ev.business) {
    const b = ev.business
    result.business = {
      id: b.id,
      name: b.name,
      city: b.city,
      address: b.address,
      latitude: b.latitude != null ? Number(b.latitude) : null,
      longitude: b.longitude != null ? Number(b.longitude) : null,
      imageUrl: Array.isArray(b.images) && b.images[0] ? b.images[0] : null,
    }
  }
  if (ev.featuredWaveLeader) {
    result.featuredWaveLeader = {
      id: ev.featuredWaveLeader.id,
      displayName: ev.featuredWaveLeader.displayName,
      specialty: ev.featuredWaveLeader.specialty,
    }
  }
  return result
}

export const userService = {
  /**
   * Get user profile with stats
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rewards: true,
        checkIns: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        communityMemberships: {
          include: {
            community: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          take: 10,
        },
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Get stats
    const checkInsCount = await prisma.checkIn.count({
      where: { userId },
    })

    const uniquePlaces = await prisma.checkIn.findMany({
      where: { userId },
      select: { businessId: true },
      distinct: ['businessId'],
    })

    const reviewsCount = 0 // TODO: Implement reviews
    const bookingsCount = await prisma.booking.count({
      where: { userId },
    })

    const pointsEarned = user.rewards?.points || 0
    const memberLevel = user.rewards?.level || 1

    // Get recent reviews (mock for now)
    const recentReviews: any[] = []

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      bio: null, // TODO: Add bio field to User model
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
      stats: {
        checkIns: checkInsCount,
        placesVisited: uniquePlaces.length,
        reviewsWritten: reviewsCount,
        bookings: bookingsCount,
        pointsEarned,
        memberLevel,
      },
      communities: user.communityMemberships.map((membership) => ({
        id: membership.community.id,
        name: membership.community.name,
        description: membership.community.description || undefined,
        joinedAt: membership.joinedAt.toISOString(),
      })),
      recentReviews,
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        // bio: data.bio, // TODO: Add bio field
      },
    })

    return this.getProfile(userId)
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(userId: string, fileBuffer: Buffer, filename: string) {
    // TODO: Upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll just store the filename
    // In production, upload to cloud storage and store the URL

    const avatarUrl = `/uploads/avatars/${userId}-${Date.now()}-${filename}`

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    })

    return { avatar: avatarUrl }
  },

  /**
   * Update user settings
   */
  async updateSettings(userId: string, settings: UserSettings) {
    // TODO: Store settings in database (create UserSettings model or JSON field)
    // For now, return the settings as-is
    return settings
  },

  /**
   * Delete user account
   */
  async deleteAccount(userId: string) {
    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    })

    return { success: true }
  },

  /**
   * Get user stats for dashboard
   */
  async getUserStats(userId: string) {
    const [checkInsCount, favoritesCount, bookingsCount, rewards] = await Promise.all([
      prisma.checkIn.count({ where: { userId } }),
      prisma.favorite.count({ where: { userId } }),
      prisma.booking.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
      prisma.userReward.findUnique({ where: { userId } }).catch(() => null), // Handle missing UserReward gracefully
    ])

    const checkInsThisMonth = await prisma.checkIn.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    })

    const level = this.calculateLevel(checkInsCount)

    return {
      totalCheckIns: checkInsCount,
      checkInsThisMonth,
      rewardPoints: rewards?.points || 0,
      rewardLevel: level,
      upcomingBookings: await prisma.booking.count({
        where: {
          userId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      }),
      favoritesCount,
    }
  },

  /**
   * Get user bookings (tabs: upcoming | past | cancelled)
   */
  async getBookings(
    userId: string,
    status?: string,
    limit?: number,
    sort?: string,
    search?: string
  ) {
    const take = Math.min(limit ?? 200, 500)
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        waveLeader: {
          select: {
            id: true,
            displayName: true,
            specialty: true,
            rating: true,
            totalReviews: true,
            user: { select: { avatar: true } },
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
      take,
    })

    const now = Date.now()
    const tab = status || 'all'

    let filtered = bookings.filter((b) => {
      const start = bookingStartMs(b.scheduledDate, b.scheduledTime)
      const end = start + b.duration * 60 * 60 * 1000

      if (search?.trim()) {
        const q = search.trim().toLowerCase()
        if (!b.waveLeader?.displayName.toLowerCase().includes(q)) {
          return false
        }
      }

      if (tab === 'upcoming') {
        return (
          ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status) && start > now
        )
      }
      if (tab === 'past') {
        return (
          b.status === 'COMPLETED' ||
          (b.status === 'CONFIRMED' && end < now) ||
          (b.status === 'IN_PROGRESS' && end < now)
        )
      }
      if (tab === 'cancelled') {
        return ['CANCELLED', 'DECLINED'].includes(b.status)
      }
      return true
    })

    const sortKey = sort || 'date_asc'
    filtered.sort((a, b) => {
      const sa = bookingStartMs(a.scheduledDate, a.scheduledTime)
      const sb = bookingStartMs(b.scheduledDate, b.scheduledTime)
      const pa = Number(a.totalAmount)
      const pb = Number(b.totalAmount)
      if (sortKey === 'date_desc') return sb - sa
      if (sortKey === 'price_asc') return pa - pb
      if (sortKey === 'price_desc') return pb - pa
      return sa - sb
    })

    return filtered.map((booking) => ({
      id: booking.id,
      reference: `WF-${booking.id.slice(-8).toUpperCase()}`,
      waveLeaderId: booking.waveLeaderId,
      waveLeader: booking.waveLeader
        ? {
            id: booking.waveLeader.id,
            displayName: booking.waveLeader.displayName,
            specialty: booking.waveLeader.specialty,
            rating: Number(booking.waveLeader.rating),
            totalReviews: booking.waveLeader.totalReviews,
            avatar: booking.waveLeader.user?.avatar ?? null,
          }
        : null,
      scheduledDate: booking.scheduledDate.toISOString().slice(0, 10),
      scheduledTime: booking.scheduledTime,
      duration: booking.duration,
      serviceType: booking.serviceType,
      location: booking.location,
      totalAmount: Number(booking.totalAmount),
      serviceFee: Number(booking.serviceFee),
      status: booking.status,
      notes: booking.notes,
      rating: booking.rating,
      review: booking.review,
      cancelReason: booking.cancelReason,
      createdAt: booking.createdAt.toISOString(),
    }))
  },

  /**
   * Calculate member level based on check-ins
   */
  calculateLevel(checkInsCount: number): number {
    if (checkInsCount >= 100) return 4 // Platinum
    if (checkInsCount >= 50) return 3 // Gold
    if (checkInsCount >= 20) return 2 // Silver
    return 1 // Bronze
  },

  /**
   * Get user activity feed
   */
  async getActivity(userId: string, limit: number = 5) {
    const activities: any[] = []

    // Get recent check-ins
    const recentCheckIns = await prisma.checkIn.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    recentCheckIns.forEach((checkIn) => {
      activities.push({
        id: checkIn.id,
        type: 'check_in',
        title: `Checked in at ${checkIn.business.name}`,
        description: `Earned ${checkIn.points} points`,
        timestamp: checkIn.createdAt.toISOString(),
        link: `/business/${checkIn.business.id}`,
      })
    })

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        waveLeader: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    recentBookings.forEach((booking) => {
      activities.push({
        id: booking.id,
        type: 'booking',
        title: `Booked ${booking.waveLeader.displayName}`,
        description: `Status: ${booking.status}`,
        timestamp: booking.createdAt.toISOString(),
        link: `/dashboard/bookings/${booking.id}`,
      })
    })

    // Sort by timestamp and return top N
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  },

  /**
   * Get passport data
   */
  async getPassportData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { rewards: true },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    const checkInsCount = await prisma.checkIn.count({ where: { userId } })

    const uniquePlaces = await prisma.checkIn.groupBy({
      by: ['businessId'],
      where: { userId },
    })

    const level = this.calculateLevel(checkInsCount)
    const levelName = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][level - 1] || 'BRONZE'

    const passportId = `WF-${userId.slice(0, 4).toUpperCase()}-${userId.slice(-4).toUpperCase()}`

    return {
      passportId,
      level: levelName as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
      totalCheckIns: checkInsCount,
      totalPoints: user.rewards?.points || 0,
      placesVisited: uniquePlaces.length,
      memberSince: user.createdAt.toISOString(),
      qrPayload: JSON.stringify({
        type: 'wavefinder_passport',
        userId: user.id,
        passportId,
      }),
    }
  },

  /**
   * Get user favorites
   */
  async getFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            latitude: true,
            longitude: true,
            phone: true,
            website: true,
            images: true,
            rating: true,
            totalReviews: true,
            isVerified: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return favorites.map((fav) => fav.business)
  },

  /**
   * Add favorite
   */
  async addFavorite(userId: string, businessId: string) {
    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    })

    if (!business) {
      throw new NotFoundError('Business not found')
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    })

    if (existing) {
      throw new BadRequestError('Business already in favorites')
    }

    // Create favorite
    await prisma.favorite.create({
      data: {
        userId,
        businessId,
      },
    })

    return { message: 'Added to favorites' }
  },

  /**
   * Remove favorite
   */
  async removeFavorite(userId: string, businessId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    })

    if (!favorite) {
      throw new NotFoundError('Favorite not found')
    }

    await prisma.favorite.delete({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    })

    return { message: 'Removed from favorites' }
  },

  /**
   * Get user's joined communities
   */
  async getMyCommunities(userId: string) {
    const memberships = await prisma.communityMembership.findMany({
      where: { userId },
      include: { community: true },
      orderBy: { joinedAt: 'desc' },
    })

    return memberships.map((m) => ({
      ...m.community,
      joinedAt: m.joinedAt.toISOString(),
      isAvailable: m.isAvailable,
    }))
  },

  /**
   * Registered events for the current user (tabs: upcoming / past / cancelled).
   */
  async getMyEvents(userId: string, status?: 'upcoming' | 'past' | 'cancelled') {
    const now = new Date()
    let where: Prisma.EventAttendeeWhereInput = { userId }

    if (status === 'upcoming') {
      where = {
        ...where,
        status: { not: 'CANCELLED' },
        event: { endDate: { gte: now } },
      }
    } else if (status === 'past') {
      where = {
        ...where,
        status: { not: 'CANCELLED' },
        event: { endDate: { lt: now } },
      }
    } else if (status === 'cancelled') {
      where = { ...where, status: 'CANCELLED' }
    } else {
      where = { ...where, status: { not: 'CANCELLED' } }
    }

    const rows = await prisma.eventAttendee.findMany({
      where,
      include: {
        event: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                latitude: true,
                longitude: true,
                images: true,
              },
            },
            featuredWaveLeader: {
              select: { id: true, displayName: true, specialty: true },
            },
          },
        },
      },
      orderBy:
        status === 'past'
          ? { event: { startDate: 'desc' } }
          : { event: { startDate: 'asc' } },
    })

    return rows.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      userId: row.userId,
      registeredAt: row.registeredAt.toISOString(),
      status: row.status,
      ticketsPurchased: row.ticketsPurchased,
      totalPaid: row.totalPaid != null ? Number(row.totalPaid) : null,
      paymentIntentId: row.paymentIntentId,
      checkedIn: row.checkedIn,
      checkedInAt: row.checkedInAt?.toISOString() ?? null,
      qrPayload: JSON.stringify({ attendeeId: row.id, eventId: row.eventId }),
      event: serializeUserEventRow(row.event),
    }))
  },

  /**
   * Get user settings
   */
  async getSettings(_userId: string) {
    // TODO: Store settings in database
    // For now, return default settings
    return {
      privacy: {
        profileVisibility: 'public',
        showCheckInHistory: true,
        allowLocationTracking: true,
      },
      notifications: {
        email: {
          bookingConfirmations: true,
          bookingReminders: true,
          promotionalOffers: false,
          weeklyDigest: true,
        },
        push: {
          nearbyDeals: true,
          checkInReminders: false,
          newWaveLeaders: true,
        },
      },
      preferences: {
        defaultMapView: 'map',
        distanceUnit: 'miles',
        theme: 'dark',
        language: 'en',
      },
    }
  },
}

