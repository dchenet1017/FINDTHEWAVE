import { prisma } from '../../lib/prisma'
import { BadRequestError, NotFoundError, ValidationError } from '../../utils/errors'
import type { WaveLeaderRegistrationInput } from './waveleader.schema'
import { Decimal } from '@prisma/client/runtime/library'
import * as waveleadersPublicService from '../waveleaders-public/waveleaders-public.service'

const BOOKING_TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
]

function toDateOnlyString(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseMonth(month: string) {
  // month: YYYY-MM
  const [y, m] = month.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || m < 1 || m > 12) return null
  return { y, m }
}

function startOfWeek(d: Date, weekStartsOn: number = 1): Date {
  const day = d.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  const result = new Date(d)
  result.setDate(d.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function subDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() - days)
  return result
}

export const waveleaderService = {
  /**
   * Register a new WaveLeader application
   * - User must be authenticated and have USER role
   * - User must NOT already be a WaveLeader
   * - Creates WaveLeader with isVerified: false
   * - Updates user: phone, avatar
   * - Creates CommunityWaveLeader for selected communities
   * - Updates user role to WAVELEADER
   */
  async register(userId: string, data: WaveLeaderRegistrationInput) {
    const existingWaveLeader = await prisma.waveLeader.findUnique({
      where: { userId },
    })

    if (existingWaveLeader) {
      throw new BadRequestError('You are already registered as a WaveLeader')
    }

    const tags = [
      ...(data.services || []),
      ...(data.certifications || []),
      ...(data.tags || []),
    ].filter(Boolean)

    const waveLeader = await prisma.$transaction(async (tx) => {
      // Update user profile (phone, avatar)
      await tx.user.update({
        where: { id: userId },
        data: {
          phone: data.phone || undefined,
          avatar: data.profilePhoto || undefined,
          role: 'WAVELEADER',
        },
      })

      // Create WaveLeader
      const wl = await tx.waveLeader.create({
        data: {
          userId,
          displayName: data.displayName,
          specialty: data.specialty,
          description: data.description,
          hourlyRate: new Decimal(data.hourlyRate),
          portfolioImages: data.portfolioImages || [],
          tags,
          location: data.location || null,
          latitude: data.latitude != null ? new Decimal(data.latitude) : null,
          longitude: data.longitude != null ? new Decimal(data.longitude) : null,
          isVerified: false,
        },
      })

      // Create CommunityWaveLeader assignments
      if (data.communities?.length) {
        await tx.communityWaveLeader.createMany({
          data: data.communities.map((communityId) => ({
            waveLeaderId: wl.id,
            communityId,
          })),
          skipDuplicates: true,
        })
      }

      return wl
    })

    return {
      id: waveLeader.id,
      displayName: waveLeader.displayName,
      isVerified: waveLeader.isVerified,
    }
  },

  /**
   * Get WaveLeader profile by userId
   */
  async getByUserId(userId: string) {
    const waveLeader = await prisma.waveLeader.findUnique({
      where: { userId },
      include: { user: { select: { avatar: true, phone: true } } },
    })
    if (!waveLeader) throw new NotFoundError('WaveLeader profile not found')
    return waveLeader
  },

  /**
   * Get dashboard overview for WaveLeader
   */
  async getDashboard(userId: string) {
    const wl = await this.getByUserId(userId)
    const now = new Date()
    const weekStart = startOfWeek(now, 1)
    const thirtyDaysAgo = subDays(now, 30)

    const [thisWeekBookings, thisWeekEarnings, upcomingBookings, recentReviews] =
      await Promise.all([
        prisma.booking.count({
          where: {
            waveLeaderId: wl.id,
            scheduledDate: { gte: weekStart, lte: now },
            status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
          },
        }),
        prisma.booking.aggregate({
          where: {
            waveLeaderId: wl.id,
            scheduledDate: { gte: weekStart, lte: now },
            status: 'COMPLETED',
          },
          _sum: { totalAmount: true },
        }),
        prisma.booking.findMany({
          where: { waveLeaderId: wl.id, status: { in: ['PENDING', 'CONFIRMED'] } },
          take: 5,
          orderBy: { scheduledDate: 'asc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        prisma.booking.findMany({
          where: {
            waveLeaderId: wl.id,
            rating: { not: null },
            review: { not: null },
          },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        }),
      ])

    const earningsByDay = await prisma.booking.groupBy({
      by: ['scheduledDate'],
      where: {
        waveLeaderId: wl.id,
        status: 'COMPLETED',
        scheduledDate: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
    })

    const earningsChart = earningsByDay.map((e) => ({
      date: e.scheduledDate.toISOString().split('T')[0],
      amount: Number(e._sum.totalAmount ?? 0),
    }))

    const center: [number, number] | undefined =
      wl.longitude != null && wl.latitude != null
        ? [Number(wl.longitude), Number(wl.latitude)]
        : undefined

    return {
      displayName: wl.displayName,
      isAvailable: wl.isAvailable,
      isVerified: wl.isVerified,
      rating: Number(wl.rating),
      totalReviews: wl.totalReviews,
      thisWeekBookings,
      thisWeekEarnings: Number(thisWeekEarnings._sum.totalAmount ?? 0),
      responseRate: wl.totalBookings > 0 ? 95 : 0,
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b.id,
        clientName: `${b.user.firstName ?? ''} ${b.user.lastName ?? ''}`.trim() || 'Client',
        date: b.scheduledDate.toISOString().split('T')[0],
        time: b.scheduledTime,
        location: wl.location ?? undefined,
      })),
      recentReviews: recentReviews.map((b) => ({
        id: b.id,
        clientName: `${b.user?.firstName ?? ''} ${b.user?.lastName ?? ''}`.trim() || 'Client',
        rating: b.rating ?? 0,
        comment: b.review ?? '',
        date: b.createdAt.toISOString().split('T')[0],
      })),
      earningsChart,
      serviceArea: center
        ? {
            center,
            radiusMiles: 10,
            businessesCount: 0,
          }
        : undefined,
    }
  },

  /**
   * Get stats for WaveLeader
   */
  async getStats(userId: string) {
    const wl = await this.getByUserId(userId)
    const now = new Date()
    const weekStart = startOfWeek(now, 1)

    const [thisWeekBookings, thisWeekEarnings] = await Promise.all([
      prisma.booking.count({
        where: {
          waveLeaderId: wl.id,
          scheduledDate: { gte: weekStart, lte: now },
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      prisma.booking.aggregate({
        where: {
          waveLeaderId: wl.id,
          scheduledDate: { gte: weekStart, lte: now },
          status: 'COMPLETED',
        },
        _sum: { totalAmount: true },
      }),
    ])

    return {
      thisWeekBookings,
      thisWeekEarnings: Number(thisWeekEarnings._sum.totalAmount ?? 0),
      rating: Number(wl.rating),
      totalReviews: wl.totalReviews,
      responseRate: wl.totalBookings > 0 ? 95 : 0,
      trend: { bookings: 0, earnings: 0 },
    }
  },

  /**
   * Get bookings for WaveLeader (with optional status filter)
   */
  async getBookings(userId: string, status?: string) {
    const wl = await this.getByUserId(userId)
    const where: { waveLeaderId: string; status?: unknown } = { waveLeaderId: wl.id }
    if (status && ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED'].includes(status)) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    })

    return bookings.map((b) => ({
      id: b.id,
      reference: `WF-${b.id.slice(-8).toUpperCase()}`,
      userId: b.userId,
      user: b.user
        ? {
            id: b.user.id,
            firstName: b.user.firstName,
            lastName: b.user.lastName,
            email: b.user.email,
            avatar: b.user.avatar,
            displayName: `${b.user.firstName ?? ''} ${b.user.lastName ?? ''}`.trim() || 'Client',
          }
        : null,
      scheduledDate: b.scheduledDate.toISOString().slice(0, 10),
      scheduledTime: b.scheduledTime,
      duration: b.duration,
      serviceType: b.serviceType,
      location: b.location,
      notes: b.notes,
      totalAmount: Number(b.totalAmount),
      serviceFee: Number(b.serviceFee),
      status: b.status,
      cancelReason: b.cancelReason,
      rating: b.rating,
      review: b.review,
      createdAt: b.createdAt.toISOString(),
    }))
  },

  /**
   * Get booking stats for dashboard bar
   */
  async getBookingsStats(userId: string) {
    const wl = await this.getByUserId(userId)
    const now = new Date()
    const weekStart = startOfWeek(now, 1)

    const [thisWeekBookings, thisWeekRevenue, pendingCount] = await Promise.all([
      prisma.booking.count({
        where: {
          waveLeaderId: wl.id,
          scheduledDate: { gte: weekStart },
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      prisma.booking.aggregate({
        where: {
          waveLeaderId: wl.id,
          scheduledDate: { gte: weekStart },
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.count({
        where: { waveLeaderId: wl.id, status: 'PENDING' },
      }),
    ])

    return {
      thisWeekBookings,
      thisWeekRevenue: Number(thisWeekRevenue._sum.totalAmount ?? 0),
      pendingCount,
      averageRating: Number(wl.rating),
      totalReviews: wl.totalReviews,
    }
  },

  /**
   * Update availability status
   */
  async updateAvailability(userId: string, isAvailable: boolean) {
    const wl = await prisma.waveLeader.update({
      where: { userId },
      data: { isAvailable },
    })
    return { isAvailable: wl.isAvailable }
  },

  /**
   * Get own WaveLeader profile (for editing)
   */
  async getMe(userId: string) {
    const wl = await prisma.waveLeader.findUnique({
      where: { userId },
      include: { user: { select: { phone: true, avatar: true } } },
    })
    if (!wl) throw new NotFoundError('WaveLeader profile not found')
    return this._toProfile(wl)
  },

  _toProfile(wl: any) {
    return {
      id: wl.id,
      displayName: wl.displayName,
      specialty: wl.specialty,
      description: wl.description,
      hourlyRate: Number(wl.hourlyRate),
      portfolioImages: wl.portfolioImages ?? [],
      tags: wl.tags ?? [],
      location: wl.location,
      latitude: wl.latitude != null ? Number(wl.latitude) : null,
      longitude: wl.longitude != null ? Number(wl.longitude) : null,
      isVerified: wl.isVerified,
      rating: Number(wl.rating),
      totalReviews: wl.totalReviews,
      totalBookings: wl.totalBookings,
      isAvailable: wl.isAvailable,
      user: wl.user ? { phone: wl.user.phone, avatar: wl.user.avatar } : undefined,
    }
  },

  /**
   * Update WaveLeader profile
   */
  async updateMe(userId: string, data: any) {
    const updateData: any = {}
    if (data.displayName != null) updateData.displayName = data.displayName
    if (data.specialty != null) updateData.specialty = data.specialty
    if (data.description != null) updateData.description = data.description
    if (data.hourlyRate != null) updateData.hourlyRate = new Decimal(data.hourlyRate)
    if (data.portfolioImages != null) updateData.portfolioImages = data.portfolioImages
    if (data.tags != null) updateData.tags = data.tags
    if (data.location != null) updateData.location = data.location
    if (data.latitude != null) updateData.latitude = new Decimal(data.latitude)
    if (data.longitude != null) updateData.longitude = new Decimal(data.longitude)

    const wl = await prisma.waveLeader.update({
      where: { userId },
      data: updateData,
      include: { user: { select: { phone: true, avatar: true } } },
    })

    if (data.phone != null) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone: data.phone },
      })
    }

    return this._toProfile(wl)
  },

  /**
   * Get public WaveLeader profile by id
   */
  async getPublicProfile(id: string) {
    const wl = await prisma.waveLeader.findUnique({
      where: { id },
      include: {
        user: { select: { phone: true, avatar: true } },
        communityAssignments: {
          include: { community: { select: { id: true, name: true } } },
        },
      },
    })
    if (!wl) throw new NotFoundError('WaveLeader not found')
    const profile = this._toProfile(wl)
    return {
      ...profile,
      communities: wl.communityAssignments?.map((ca) => ca.community) ?? [],
    }
  },

  /**
   * Get reviews for WaveLeader
   */
  async getReviews(waveLeaderId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    const [reviews, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          waveLeaderId,
          rating: { not: null },
          review: { not: null },
        },
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.booking.count({
        where: {
          waveLeaderId,
          rating: { not: null },
          review: { not: null },
        },
      }),
    ])

    return {
      reviews: reviews.map((b) => ({
        id: b.id,
        clientName:
          (b as any).reviewAnonymous
            ? 'Anonymous'
            : `${b.user?.firstName ?? ''} ${b.user?.lastName ?? ''}`.trim() || 'Client',
        clientAvatar: (b as any).reviewAnonymous ? null : (b.user as any)?.avatar ?? null,
        rating: b.rating ?? 0,
        comment: b.review ?? '',
        tags: (b as any).reviewTags ?? [],
        date: b.createdAt.toISOString(),
        waveLeaderResponse: null,
      })),
      total,
    }
  },

  async getReviewStats(waveLeaderId: string) {
    const [wl, bookings] = await Promise.all([
      prisma.waveLeader.findUnique({
        where: { id: waveLeaderId },
        select: { rating: true, totalReviews: true },
      }),
      prisma.booking.findMany({
        where: { waveLeaderId, rating: { not: null } },
        select: { rating: true, reviewTags: true },
      }),
    ])

    const total = wl?.totalReviews ?? 0
    const overall = Number(wl?.rating ?? 0)
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
    const tagCounts = new Map<string, number>()

    bookings.forEach((b) => {
      const r = b.rating ?? 0
      if (r >= 1 && r <= 5) dist[r] += 1
      ;(b.reviewTags ?? []).forEach((t) => {
        const key = (t || '').toString().trim()
        if (!key) return
        tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1)
      })
    })

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: dist[star],
      percent: total ? Math.round((dist[star] / total) * 100) : 0,
    }))

    const commonTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({ id, count }))

    return {
      overallRating: overall,
      totalReviews: total,
      distribution,
      commonTags,
    }
  },

  /**
   * Get service area config
   */
  async getServiceArea(userId: string) {
    const wl = await this.getByUserId(userId)
    const lat = wl.latitude != null ? Number(wl.latitude) : null
    const lng = wl.longitude != null ? Number(wl.longitude) : null
    const radius = 10
    return {
      center: lat != null && lng != null ? ([lng, lat] as [number, number]) : ([-73.9857, 40.7484] as [number, number]),
      radius,
      address: wl.location ?? undefined,
    }
  },

  /**
   * Update service area
   */
  async updateServiceArea(
    userId: string,
    data: { latitude: number; longitude: number; radius?: number }
  ) {
    await prisma.waveLeader.update({
      where: { userId },
      data: {
        latitude: new Decimal(data.latitude),
        longitude: new Decimal(data.longitude),
      },
    })
    return this.getServiceArea(userId)
  },

  /**
   * Get opportunities (businesses seeking WaveLeaders in area)
   */
  async getOpportunities(userId: string) {
    const wl = await this.getByUserId(userId)
    const lat = wl.latitude != null ? Number(wl.latitude) : null
    const lng = wl.longitude != null ? Number(wl.longitude) : null
    if (lat == null || lng == null) return []

    const businesses = await prisma.business.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      take: 20,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        latitude: true,
        longitude: true,
      },
    })

    return businesses
      .filter((b) => b.latitude != null && b.longitude != null)
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        description: b.description ?? undefined,
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
        distance: this._haversineMiles(lat, lng, Number(b.latitude), Number(b.longitude)),
      }))
  },

  _haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  /**
   * Get booking locations for map
   */
  async getBookingLocations(userId: string, period: string = 'week') {
    const wl = await this.getByUserId(userId)
    const lat = wl.latitude != null ? Number(wl.latitude) : null
    const lng = wl.longitude != null ? Number(wl.longitude) : null

    const bookings = await prisma.booking.findMany({
      where: {
        waveLeaderId: wl.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      take: 10,
      orderBy: { scheduledDate: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    })

    return bookings.map((b) => ({
      id: b.id,
      latitude: lat ?? 40.7128,
      longitude: lng ?? -74.006,
      address: wl.location ?? undefined,
      date: b.scheduledDate.toISOString().split('T')[0],
      time: b.scheduledTime,
      clientName: `${b.user.firstName ?? ''} ${b.user.lastName ?? ''}`.trim() || 'Client',
      distance: lat != null && lng != null ? 0 : undefined,
    }))
  },

  /**
   * Get earnings heatmap data
   */
  async getEarningsHeatmap(userId: string, period: string = 'week') {
    const wl = await this.getByUserId(userId)
    const now = new Date()
    let startDate: Date
    if (period === 'week') {
      startDate = subDays(now, 7)
    } else if (period === 'month') {
      startDate = subDays(now, 30)
    } else {
      startDate = new Date(0)
    }

    const completed = await prisma.booking.findMany({
      where: {
        waveLeaderId: wl.id,
        status: 'COMPLETED',
        scheduledDate: { gte: startDate },
      },
      select: {
        totalAmount: true,
        scheduledDate: true,
      },
    })

    const lat = wl.latitude != null ? Number(wl.latitude) : null
    const lng = wl.longitude != null ? Number(wl.longitude) : null
    if (lat == null || lng == null) return []

    return completed.map((b, i) => ({
      lat: lat + (Math.random() - 0.5) * 0.01,
      lng: lng + (Math.random() - 0.5) * 0.01,
      weight: Number(b.totalAmount),
    }))
  },

  /**
   * List WaveLeaders with filters (public discovery)
   */
  async listWaveLeaders(filters: any) {
    return waveleadersPublicService.listWaveLeaders({
      page: filters.page,
      limit: filters.limit,
      specialty: filters.specialty,
      minRate: filters.minRate,
      maxRate: filters.maxRate,
      minRating: filters.minRating,
      availableNow: filters.availableNow === 'true',
      verifiedOnly: filters.verifiedOnly === 'true',
      lat: filters.lat ? parseFloat(filters.lat) : undefined,
      lng: filters.lng ? parseFloat(filters.lng) : undefined,
      radiusMiles: filters.radiusMiles ? parseFloat(filters.radiusMiles) : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      search: filters.search,
    })
  },

  /**
   * Get nearby WaveLeaders (public)
   */
  async getNearbyWaveLeaders(lat: number, lng: number, radiusMiles: number, limit?: number) {
    return waveleadersPublicService.getNearbyWaveLeaders(lat, lng, radiusMiles, limit)
  },

  /**
   * Search WaveLeaders (public)
   */
  async searchWaveLeaders(q: string, limit?: number) {
    return waveleadersPublicService.searchWaveLeaders(q, limit)
  },

  /**
   * Get availability - simple isAvailable or date-based time slots
   */
  async getAvailability(id: string, date?: string, month?: string) {
    if (month) {
      return this.getAvailabilityForMonth(id, month)
    }
    if (date) {
      return this.getAvailabilityForDate(id, date)
    }
    return waveleadersPublicService.getAvailability(id)
  },

  /**
   * Get available dates for a month (YYYY-MM).
   * For M5: if WaveLeader isAvailable, mark weekdays available unless fully booked.
   */
  async getAvailabilityForMonth(waveLeaderId: string, month: string) {
    const parsed = parseMonth(month)
    if (!parsed) {
      throw new BadRequestError('month must be YYYY-MM')
    }
    const { y, m } = parsed
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0) // last day of month
    end.setHours(23, 59, 59, 999)

    const wl = await prisma.waveLeader.findUnique({
      where: { id: waveLeaderId },
      select: { id: true, isAvailable: true },
    })
    if (!wl) throw new NotFoundError('WaveLeader not found')

    const bookings = await prisma.booking.findMany({
      where: {
        waveLeaderId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        scheduledDate: { gte: start, lte: end },
      },
      select: { scheduledDate: true, scheduledTime: true },
    })

    const bookedByDay = new Map<string, Set<string>>()
    for (const b of bookings) {
      const day = toDateOnlyString(b.scheduledDate)
      if (!bookedByDay.has(day)) bookedByDay.set(day, new Set())
      if (b.scheduledTime) bookedByDay.get(day)!.add(b.scheduledTime)
    }

    const availableDates: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d)
      day.setHours(0, 0, 0, 0)
      if (day < today) continue
      const weekday = day.getDay() // 0 Sun .. 6 Sat
      const dateStr = toDateOnlyString(day)
      if (!wl.isAvailable) continue
      // weekend slightly reduced availability (still allow if not booked out)
      const booked = bookedByDay.get(dateStr)?.size ?? 0
      const capacity = weekday === 0 || weekday === 6 ? 6 : BOOKING_TIME_SLOTS.length
      if (booked < capacity) availableDates.push(dateStr)
    }

    return { month, availableDates }
  },

  /**
   * Get time slots for a specific date (YYYY-MM-DD)
   */
  async getSlotsForDate(waveLeaderId: string, date: string) {
    const [y, m, d] = date.split('-').map((n) => parseInt(n, 10))
    if (!y || !m || !d) throw new BadRequestError('date must be YYYY-MM-DD')
    const start = new Date(y, m - 1, d)
    start.setHours(0, 0, 0, 0)
    const end = new Date(y, m - 1, d)
    end.setHours(23, 59, 59, 999)

    const wl = await prisma.waveLeader.findUnique({
      where: { id: waveLeaderId },
      select: { id: true, isAvailable: true },
    })
    if (!wl) throw new NotFoundError('WaveLeader not found')

    const bookings = await prisma.booking.findMany({
      where: {
        waveLeaderId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        scheduledDate: { gte: start, lte: end },
      },
      select: { scheduledTime: true },
    })
    const bookedTimes = new Set(bookings.map((b) => b.scheduledTime).filter(Boolean) as string[])

    const slots = BOOKING_TIME_SLOTS.map((t) => ({
      time: t,
      status: !wl.isAvailable || bookedTimes.has(t) ? ('booked' as const) : ('available' as const),
    }))

    return { date, slots }
  },

  /**
   * Get availability for a specific date with time slots (mock for M6 calendar)
   */
  async getAvailabilityForDate(waveLeaderId: string, date: string) {
    const wl = await prisma.waveLeader.findUnique({
      where: { id: waveLeaderId },
      select: { id: true, isAvailable: true },
    })
    if (!wl) throw new NotFoundError('WaveLeader not found')
    // TODO: Implement actual availability/calendar system in M6
    return {
      date,
      available: wl.isAvailable,
      timeSlots: [
        { time: '09:00', available: wl.isAvailable },
        { time: '10:00', available: wl.isAvailable },
        { time: '11:00', available: false },
        { time: '13:00', available: wl.isAvailable },
        { time: '14:00', available: wl.isAvailable },
        { time: '15:00', available: wl.isAvailable },
      ],
    }
  },

  /**
   * Add portfolio image (URL) - max 5
   */
  async addPortfolioImage(userId: string, imageUrl: string) {
    const wl = await this.getByUserId(userId)
    const currentImages = wl.portfolioImages ?? []
    if (currentImages.length >= 5) {
      throw new ValidationError('Maximum 5 portfolio images allowed')
    }
    const updated = await prisma.waveLeader.update({
      where: { userId },
      data: { portfolioImages: [...currentImages, imageUrl] },
    })
    return this._toProfile(updated)
  },

  /**
   * Remove portfolio image by URL or index
   */
  async removePortfolioImage(userId: string, imageIdOrUrl: string) {
    const wl = await this.getByUserId(userId)
    const currentImages = wl.portfolioImages ?? []
    const idx = parseInt(imageIdOrUrl, 10)
    const updatedImages = Number.isNaN(idx)
      ? currentImages.filter((img) => img !== imageIdOrUrl)
      : currentImages.filter((_, i) => i !== idx)
    await prisma.waveLeader.update({
      where: { userId },
      data: { portfolioImages: updatedImages },
    })
    return { message: 'Image removed' }
  },
}
