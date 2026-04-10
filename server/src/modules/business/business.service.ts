import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors'
import * as ownerEvents from './business-events.service'

const advertisementRepo = prisma.advertisement as any

const getBusinessForUser = async (userId: string) => {
  const business = await prisma.business.findUnique({ where: { userId } })
  if (!business) {
    throw new NotFoundError('Business not found for this user')
  }
  return business
}

const toNumber = (value: any) => {
  if (value == null) return 0
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const toIsoDay = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10)
}

const getRangeFromPeriod = (period?: string, startDate?: string, endDate?: string) => {
  const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date()
  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date(end)
  const value = (period || '30d').toLowerCase()

  if (startDate && endDate) {
    return { start, end }
  }

  switch (value) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
    case '7d':
      start.setDate(end.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      break
    case 'month':
    case '30d':
      start.setDate(end.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      break
    case '90d':
      start.setDate(end.getDate() - 89)
      start.setHours(0, 0, 0, 0)
      break
    case 'year':
    case '1y':
      start.setFullYear(end.getFullYear() - 1)
      start.setDate(end.getDate() + 1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start.setDate(end.getDate() - 29)
      start.setHours(0, 0, 0, 0)
  }

  return { start, end }
}

const percentageChange = (current: number, previous: number) => {
  if (!previous) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

const bucketByDay = (dates: Date[]) => {
  const map = new Map<string, number>()
  for (const date of dates) {
    const key = toIsoDay(date)
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

const stableOffset = (seed: string, scale = 0.05) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const x = ((hash % 1000) / 1000 - 0.5) * scale
  const y = ((((hash / 1000) | 0) % 1000) / 1000 - 0.5) * scale
  return { x, y }
}

const calculateAdPrice = (params: {
  radius: number
  duration: number
  peakHours?: boolean
  demographics?: boolean
  weekendBoost?: boolean
}) => {
  const basePrice = 150
  let radiusMultiplier = 1
  if (params.radius <= 5) radiusMultiplier = 1
  else if (params.radius <= 10) radiusMultiplier = 1.5
  else if (params.radius <= 15) radiusMultiplier = 2
  else if (params.radius <= 20) radiusMultiplier = 2.5
  else radiusMultiplier = 3

  let dailyPrice = basePrice * radiusMultiplier
  if (params.peakHours) dailyPrice *= 1.2
  if (params.demographics) dailyPrice += 50
  if (params.weekendBoost) dailyPrice += 100

  dailyPrice = Math.round(dailyPrice)
  const totalPrice = dailyPrice * Math.max(1, params.duration)
  return { dailyPrice, totalPrice }
}

const hasDemographicTargeting = (value: any) => {
  if (!value) return false
  if (typeof value !== 'object') return Boolean(value)
  return Boolean(
    value.demographicsEnabled ||
      value.ageRange ||
      (Array.isArray(value.interests) && value.interests.length > 0)
  )
}

const serializeAd = (ad: any) => {
  const demographics = ad.targetDemographics || {}
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    type: demographics.adType || 'STANDARD_PROMOTION',
    status: ad.status,
    ctaText: ad.ctaText,
    imageUrl: ad.imageUrl,
    radiusMiles: ad.targetRadius,
    demographicsEnabled: hasDemographicTargeting(demographics),
    peakHoursEnabled: Boolean(ad.peakHoursOnly),
    weekendBoostEnabled: Boolean(demographics.weekendBoost),
    startDate: toIsoDay(ad.startDate),
    endDate: ad.endDate ? toIsoDay(ad.endDate) : null,
    dailyBudget: toNumber(ad.dailyBudget),
    totalSpent: toNumber(ad.spent),
    impressions: ad.impressions || 0,
    clicks: ad.clicks || 0,
    createdAt: ad.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: ad.updatedAt?.toISOString?.() || new Date().toISOString(),
  }
}

const getAdsStatusWhere = (businessId: string, status?: string) => {
  const now = new Date()
  const whereClause: any = { businessId }

  if (!status) return whereClause

  switch (status) {
    case 'active':
      whereClause.isActive = true
      whereClause.startDate = { lte: now }
      whereClause.endDate = { gte: now }
      break
    case 'scheduled':
      whereClause.isActive = true
      whereClause.startDate = { gt: now }
      break
    case 'paused':
      whereClause.isActive = false
      whereClause.endDate = { gte: now }
      break
    case 'completed':
      whereClause.endDate = { lt: now }
      break
    case 'cancelled':
      whereClause.status = 'CANCELLED'
      break
  }

  return whereClause
}

export const getDashboardData = async (userId: string) => {
  const business = await getBusinessForUser(userId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [todayCheckIns, weekCheckIns, activePromotions, recentCheckIns] = await Promise.all([
    prisma.checkIn.count({
      where: { businessId: business.id, createdAt: { gte: today } },
    }),
    prisma.checkIn.count({
      where: { businessId: business.id, createdAt: { gte: weekAgo } },
    }),
    prisma.promotion.count({
      where: { businessId: business.id, isActive: true, endDate: { gte: new Date() } },
    }),
    prisma.checkIn.findMany({
      where: { businessId: business.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    }),
  ])

  return {
    business: {
      id: business.id,
      name: business.name,
      logoUrl: business.images?.[0] || null,
      isVerified: business.isVerified,
    },
    verificationStatus: business.approvalStatus,
    todayCheckIns,
    weekCheckIns,
    activePromotions,
    averageRating: toNumber(business.rating),
    totalReviews: business.totalReviews,
    recentCheckIns,
    recentReviews: [],
  }
}

export const getBusinessStats = async (userId: string) => {
  const business = await getBusinessForUser(userId)
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)
  const startOfPreviousWeek = new Date(startOfWeek)
  startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7)

  const [todayCheckIns, yesterdayCheckIns, thisWeekCheckIns, prevWeekCheckIns, activePromotions, totalCustomers, totalCheckIns] =
    await Promise.all([
      prisma.checkIn.count({
        where: { businessId: business.id, createdAt: { gte: startOfToday } },
      }),
      prisma.checkIn.count({
        where: { businessId: business.id, createdAt: { gte: startOfYesterday, lt: startOfToday } },
      }),
      prisma.checkIn.count({
        where: { businessId: business.id, createdAt: { gte: startOfWeek } },
      }),
      prisma.checkIn.count({
        where: { businessId: business.id, createdAt: { gte: startOfPreviousWeek, lt: startOfWeek } },
      }),
      prisma.promotion.count({
        where: { businessId: business.id, isActive: true, endDate: { gte: now } },
      }),
      prisma.checkIn.groupBy({ by: ['userId'], where: { businessId: business.id } }).then((rows) => rows.length),
      prisma.checkIn.count({ where: { businessId: business.id } }),
    ])

  const thisWeekRevenue = thisWeekCheckIns * 10
  const prevWeekRevenue = prevWeekCheckIns * 10

  const repeatCustomerRate = totalCustomers ? Number((((totalCheckIns - totalCustomers) / totalCheckIns) * 100).toFixed(1)) : 0

  return {
    todayCheckIns,
    checkInTrend: percentageChange(todayCheckIns, yesterdayCheckIns),
    thisWeekRevenue,
    totalCustomers,
    averageRating: toNumber(business.rating),
    totalReviews: business.totalReviews,
    reviewCount: business.totalReviews,
    activePromotions,
    weekRevenueChangePct: percentageChange(thisWeekRevenue, prevWeekRevenue),
    todayCheckInsChangePct: percentageChange(todayCheckIns, yesterdayCheckIns),
    totalCheckIns,
    repeatCustomerRate,
  }
}

export const getRevenueData = async (userId: string, period: string) => {
  const business = await getBusinessForUser(userId)
  const { start, end } = getRangeFromPeriod(period)
  const checkIns = await prisma.checkIn.findMany({
    where: { businessId: business.id, createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const bucket = bucketByDay(checkIns.map((c) => c.createdAt))
  return [...bucket.entries()].map(([date, count]) => ({
    date,
    revenue: count * 10,
    checkIns: count,
  }))
}

export const getAnalytics = async (userId: string, periodOrParams: any, compareTo?: string) => {
  const params =
    typeof periodOrParams === 'object'
      ? periodOrParams
      : { period: periodOrParams, compareTo }

  const { period = '30d', startDate, endDate } = params
  const { start, end } = getRangeFromPeriod(period, startDate, endDate)
  const compareWindowDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
  const compareEnd = new Date(start)
  compareEnd.setMilliseconds(-1)
  const compareStart = new Date(compareEnd)
  compareStart.setDate(compareStart.getDate() - compareWindowDays + 1)

  const [business, currentCheckIns, compareCheckIns, topCustomers] = await Promise.all([
    getBusinessForUser(userId),
    prisma.checkIn.findMany({
      where: { businessId: (await getBusinessForUser(userId)).id, createdAt: { gte: start, lte: end } },
      select: { createdAt: true, userId: true },
      orderBy: { createdAt: 'asc' },
    }),
    params.compareTo === 'previous'
      ? prisma.checkIn.findMany({
          where: {
            businessId: (await getBusinessForUser(userId)).id,
            createdAt: { gte: compareStart, lte: compareEnd },
          },
          select: { createdAt: true, userId: true },
          orderBy: { createdAt: 'asc' },
        })
      : Promise.resolve([]),
    getTopCustomers(userId, 10),
  ])

  const currentByDay = bucketByDay(currentCheckIns.map((c) => c.createdAt))
  const compareByDay = bucketByDay(compareCheckIns.map((c) => c.createdAt))

  const checkInsSeries = [...currentByDay.entries()].map(([date, value]) => ({ date, value }))
  const revenueSeries = checkInsSeries.map((row) => ({ date: row.date, value: row.value * 10 }))

  const seen = new Set<string>()
  const customerSeries = [...currentByDay.entries()].map(([date, value]) => {
    const dayUsers = currentCheckIns.filter((c) => toIsoDay(c.createdAt) === date).map((c) => c.userId)
    let newCount = 0
    for (const userId of dayUsers) {
      if (!seen.has(userId)) {
        seen.add(userId)
        newCount += 1
      }
    }
    const returning = Math.max(0, value - newCount)
    const retentionRate = value ? Number(((returning / value) * 100).toFixed(1)) : 0
    return { date, new: newCount, returning, retentionRate }
  })

  const currentTotalCheckIns = currentCheckIns.length
  const previousTotalCheckIns = compareCheckIns.length
  const currentRevenue = currentTotalCheckIns * 10
  const previousRevenue = previousTotalCheckIns * 10
  const currentNewCustomers = new Set(currentCheckIns.map((c) => c.userId)).size
  const previousNewCustomers = new Set(compareCheckIns.map((c) => c.userId)).size

  return {
    range: { start: toIsoDay(start), end: toIsoDay(end) },
    compareRange:
      params.compareTo === 'previous'
        ? { start: toIsoDay(compareStart), end: toIsoDay(compareEnd) }
        : null,
    metrics: {
      checkIns: {
        total: currentTotalCheckIns,
        trendPct: percentageChange(currentTotalCheckIns, previousTotalCheckIns),
        sparkline: checkInsSeries.map((p) => p.value),
      },
      revenue: {
        total: currentRevenue,
        trendPct: percentageChange(currentRevenue, previousRevenue),
        sparkline: revenueSeries.map((p) => p.value),
      },
      newCustomers: {
        total: currentNewCustomers,
        trendPct: percentageChange(currentNewCustomers, previousNewCustomers),
        sparkline: customerSeries.map((p) => p.new),
      },
      avgRating: {
        value: toNumber(business.rating),
        trendPct: 0,
        reviewCount: business.totalReviews,
        sparkline: customerSeries.map(() => toNumber(business.rating)),
      },
    },
    series: {
      checkIns: checkInsSeries,
      revenue: revenueSeries,
      customers: customerSeries,
    },
    topCustomers,
  }
}

export const getPeakHours = async (userId: string, period: string) => {
  const business = await getBusinessForUser(userId)
  const { start } = getRangeFromPeriod(period)
  const checkIns = await prisma.checkIn.findMany({
    where: { businessId: business.id, createdAt: { gte: start } },
    select: { createdAt: true, points: true },
  })

  const hourlyData: Record<number, { count: number; revenue: number }> = {}
  for (let hour = 0; hour < 24; hour++) hourlyData[hour] = { count: 0, revenue: 0 }

  for (const checkIn of checkIns) {
    const hour = checkIn.createdAt.getHours()
    hourlyData[hour].count += 1
    hourlyData[hour].revenue += checkIn.points || 0
  }

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: Number(hour),
    checkIns: data.count,
    revenue: data.revenue,
    avgDurationMinutes: 60,
  }))
}

export const getTopCustomers = async (userId: string, limit: number) => {
  const business = await getBusinessForUser(userId)
  const topCustomers = await prisma.checkIn.groupBy({
    by: ['userId'],
    where: { businessId: business.id },
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: Math.min(Math.max(1, limit || 10), 50),
  })

  const customersWithDetails = await Promise.all(
    topCustomers.map(async (customer) => {
      const user = await prisma.user.findUnique({
        where: { id: customer.userId },
        select: { id: true, firstName: true, lastName: true, avatar: true },
      })

      const lastCheckIn = await prisma.checkIn.findFirst({
        where: { businessId: business.id, userId: customer.userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })

      return {
        id: customer.userId,
        firstName: user?.firstName ?? null,
        lastName: user?.lastName ?? null,
        avatar: user?.avatar ?? null,
        totalCheckIns: customer._count.userId,
        totalSpent: customer._count.userId * 10,
        lastVisit: lastCheckIn?.createdAt?.toISOString?.() || new Date().toISOString(),
      }
    })
  )

  return customersWithDetails
}

export const getPromotionsPerformance = async (userId: string) => {
  const business = await getBusinessForUser(userId)
  const promotions = await prisma.promotion.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  })

  return promotions.map((promo) => {
    const now = new Date()
    let status = 'ENDED'
    if (promo.startDate > now) status = 'SCHEDULED'
    else if (promo.isActive && promo.endDate >= now) status = 'ACTIVE'

    return {
      id: promo.id,
      name: promo.title,
      startDate: promo.startDate.toISOString(),
      endDate: promo.endDate.toISOString(),
      status,
      checkIns: 0,
      revenueImpact: 0,
    }
  })
}

export const getCustomerLocations = async (userId: string, period: string) => {
  const business = await getBusinessForUser(userId)
  const { start } = getRangeFromPeriod(period)
  const checkIns = await prisma.checkIn.findMany({
    where: { businessId: business.id, createdAt: { gte: start } },
    select: { userId: true },
  })

  const userCounts: Record<string, number> = {}
  for (const checkIn of checkIns) {
    userCounts[checkIn.userId] = (userCounts[checkIn.userId] || 0) + 1
  }

  return Object.entries(userCounts).map(([uid, count]) => {
    const offset = stableOffset(uid)
    return {
      latitude: toNumber(business.latitude) + offset.y,
      longitude: toNumber(business.longitude) + offset.x,
      count,
    }
  })
}

export const getRecentCheckIns = async (userId: string, limit: number) => {
  const business = await getBusinessForUser(userId)
  return prisma.checkIn.findMany({
    where: { businessId: business.id },
    take: Math.min(Math.max(1, limit || 5), 50),
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  })
}

export const getBusinessLocation = async (userId: string) => {
  const business = await getBusinessForUser(userId)
  const now = new Date()
  const activeAd = await advertisementRepo.findFirst({
    where: {
      businessId: business.id,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    id: business.id,
    name: business.name,
    type: business.type,
    address: business.address,
    city: business.city,
    state: business.state,
    zipCode: business.zipCode,
    latitude: toNumber(business.latitude),
    longitude: toNumber(business.longitude),
    isVerified: business.isVerified,
    approvalStatus: business.approvalStatus,
    adRadiusMiles: activeAd?.targetRadius ?? null,
  }
}

export const updateBusinessLocation = async (
  userId: string,
  location: { latitude: number; longitude: number; address: string }
) => {
  const business = await getBusinessForUser(userId)

  if (location.latitude == null || location.longitude == null) {
    throw new BadRequestError('latitude and longitude are required')
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      latitude: new Prisma.Decimal(location.latitude),
      longitude: new Prisma.Decimal(location.longitude),
      address: location.address,
    },
  })

  return {
    id: updated.id,
    name: updated.name,
    address: updated.address,
    city: updated.city,
    state: updated.state,
    zipCode: updated.zipCode,
    latitude: toNumber(updated.latitude),
    longitude: toNumber(updated.longitude),
  }
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}

export const getCompetitors = async (userId: string, radius: number) => {
  const business = await getBusinessForUser(userId)
  const baseLat = toNumber(business.latitude)
  const baseLng = toNumber(business.longitude)
  const radiusMiles = Math.min(Math.max(1, radius || 5), 25)
  const deg = radiusMiles / 69

  const candidates = await prisma.business.findMany({
    where: {
      id: { not: business.id },
      type: business.type,
      isActive: true,
      approvalStatus: 'APPROVED',
      latitude: { gte: baseLat - deg, lte: baseLat + deg },
      longitude: { gte: baseLng - deg, lte: baseLng + deg },
    },
    include: {
      _count: { select: { checkIns: true, promotions: true } },
    },
    take: 50,
  })

  return candidates
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      latitude: toNumber(item.latitude),
      longitude: toNumber(item.longitude),
      rating: toNumber(item.rating),
      isVerified: item.isVerified,
      checkIns: item._count?.checkIns ?? 0,
      hasActivePromotions: (item._count?.promotions ?? 0) > 0,
      distance: haversineMiles(baseLat, baseLng, toNumber(item.latitude), toNumber(item.longitude)),
    }))
    .filter((item) => item.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
}

export const getNearbyWaveLeaders = async (
  userId: string,
  lat?: number,
  lng?: number,
  radius = 25
) => {
  const business = await getBusinessForUser(userId)
  const baseLat = lat ?? toNumber(business.latitude)
  const baseLng = lng ?? toNumber(business.longitude)
  const deg = radius / 69

  const waveLeaders = await prisma.waveLeader.findMany({
    where: {
      latitude: { gte: baseLat - deg, lte: baseLat + deg },
      longitude: { gte: baseLng - deg, lte: baseLng + deg },
    },
    include: {
      user: { select: { avatar: true } },
    },
    take: 50,
  })

  return waveLeaders
    .map((item) => ({
      id: item.id,
      displayName: item.displayName,
      specialty: item.specialty,
      rating: toNumber(item.rating),
      hourlyRate: toNumber(item.hourlyRate),
      isAvailable: item.isAvailable,
      latitude: toNumber(item.latitude),
      longitude: toNumber(item.longitude),
      avatar: item.user?.avatar ?? null,
      distance: haversineMiles(baseLat, baseLng, toNumber(item.latitude), toNumber(item.longitude)),
    }))
    .filter((item) => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
}

export const getAdvertisements = async (userId: string, status?: string) => {
  const business = await getBusinessForUser(userId)
  const ads = await advertisementRepo.findMany({
    where: getAdsStatusWhere(business.id, status),
    orderBy: { createdAt: 'desc' },
  })
  return ads.map(serializeAd)
}

export const createAdvertisement = async (userId: string, adData: any) => {
  const business = await getBusinessForUser(userId)

  const startDate = new Date(adData.startDate)
  const endDate = adData.endDate
    ? new Date(adData.endDate)
    : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

  const duration = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const targetRadius = Number(adData.targetRadius ?? adData.radiusMiles ?? 10)
  const peakHoursOnly = Boolean(adData.peakHoursOnly ?? adData.peakHoursEnabled)
  const targetDemographics = {
    ...(adData.targetDemographics || {}),
    demographicsEnabled: Boolean(
      adData.targetDemographics ?? adData.demographicsEnabled
    ),
    weekendBoost: Boolean(adData.weekendBoost ?? adData.weekendBoostEnabled),
    adType: adData.type || 'STANDARD_PROMOTION',
  }

  const pricing = calculateAdPrice({
    radius: targetRadius,
    duration,
    peakHours: peakHoursOnly,
    demographics: hasDemographicTargeting(targetDemographics),
    weekendBoost: Boolean(targetDemographics.weekendBoost),
  })

  const ad = await advertisementRepo.create({
    data: {
      businessId: business.id,
      title: String(adData.title || '').slice(0, 60),
      description: String(adData.description || '').slice(0, 200),
      imageUrl: adData.imageUrl || null,
      ctaText: adData.ctaText || 'Learn More',
      targetRadius,
      targetDemographics,
      peakHoursOnly,
      specificHours: adData.specificHours || null,
      daysOfWeek: adData.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      dailyBudget: new Prisma.Decimal(pricing.dailyPrice),
      totalBudget: new Prisma.Decimal(pricing.totalPrice),
      spent: new Prisma.Decimal(0),
      startDate,
      endDate,
      status: startDate > new Date() ? 'SCHEDULED' : 'ACTIVE',
      isActive: true,
    },
  })

  return serializeAd(ad)
}

export const estimateAdReach = async (userId: string, radius: number, demographics?: any) => {
  await getBusinessForUser(userId)
  const area = Math.PI * Math.max(1, radius) * Math.max(1, radius)
  const estimatedReach = Math.round(area * 380 * (demographics ? 0.9 : 1))
  const estimatedImpressions = Math.round(estimatedReach * 3)
  const estimatedClicks = Math.round(estimatedImpressions * 0.02)
  const pricing = calculateAdPrice({
    radius,
    duration: 1,
    peakHours: false,
    demographics: !!demographics,
    weekendBoost: false,
  })

  return {
    estimatedReach,
    estimatedUsers: estimatedReach,
    estimatedImpressions,
    estimatedImpressionsPerDay: estimatedImpressions,
    estimatedClicks,
    estimatedClicksPerDay: estimatedClicks,
    dailyPrice: pricing.dailyPrice,
    avgCtr: 0.02,
  }
}

export const updateAdvertisement = async (userId: string, adId: string, updates: any) => {
  const business = await getBusinessForUser(userId)
  const ad = await advertisementRepo.findUnique({ where: { id: adId } })

  if (!ad || ad.businessId !== business.id) {
    throw new UnauthorizedError('Not authorized to update this advertisement')
  }

  const nextStart = new Date(updates.startDate || ad.startDate)
  const nextEnd = new Date(updates.endDate || ad.endDate)
  if (nextEnd <= nextStart) {
    throw new ValidationError('End date must be after start date')
  }

  const nextRadius = Number(updates.targetRadius ?? updates.radiusMiles ?? ad.targetRadius)
  const nextPeak = Boolean(updates.peakHoursOnly ?? updates.peakHoursEnabled ?? ad.peakHoursOnly)
  const nextDemographics = {
    ...(ad.targetDemographics || {}),
    ...(updates.targetDemographics || {}),
    ...(updates.demographicsEnabled != null ? { demographicsEnabled: Boolean(updates.demographicsEnabled) } : {}),
    ...(updates.weekendBoost != null || updates.weekendBoostEnabled != null
      ? { weekendBoost: Boolean(updates.weekendBoost ?? updates.weekendBoostEnabled) }
      : {}),
    ...(updates.type ? { adType: updates.type } : {}),
  }

  const duration = Math.max(
    1,
    Math.ceil((nextEnd.getTime() - nextStart.getTime()) / (1000 * 60 * 60 * 24))
  )

  const pricing = calculateAdPrice({
    radius: nextRadius,
    duration,
    peakHours: nextPeak,
    demographics: hasDemographicTargeting(nextDemographics),
    weekendBoost: Boolean(nextDemographics.weekendBoost),
  })

  const updated = await advertisementRepo.update({
    where: { id: adId },
    data: {
      title: updates.title ?? undefined,
      description: updates.description ?? undefined,
      imageUrl: updates.imageUrl ?? undefined,
      ctaText: updates.ctaText ?? undefined,
      targetRadius: nextRadius,
      targetDemographics: nextDemographics,
      peakHoursOnly: nextPeak,
      specificHours: updates.specificHours ?? undefined,
      daysOfWeek: updates.daysOfWeek ?? undefined,
      startDate: nextStart,
      endDate: nextEnd,
      dailyBudget: new Prisma.Decimal(pricing.dailyPrice),
      totalBudget: new Prisma.Decimal(pricing.totalPrice),
      status: nextStart > new Date() ? 'SCHEDULED' : ad.isActive ? 'ACTIVE' : 'PAUSED',
    },
  })

  return serializeAd(updated)
}

export const deleteAdvertisement = async (userId: string, adId: string) => {
  const business = await getBusinessForUser(userId)
  const ad = await advertisementRepo.findUnique({ where: { id: adId } })
  if (!ad || ad.businessId !== business.id) {
    throw new UnauthorizedError('Not authorized to delete this advertisement')
  }
  await advertisementRepo.delete({ where: { id: adId } })
}

export const pauseAdvertisement = async (userId: string, adId: string) => {
  const business = await getBusinessForUser(userId)
  const ad = await advertisementRepo.findUnique({ where: { id: adId } })
  if (!ad || ad.businessId !== business.id) {
    throw new UnauthorizedError('Not authorized')
  }
  const updated = await advertisementRepo.update({
    where: { id: adId },
    data: { isActive: false, status: 'PAUSED' },
  })
  return serializeAd(updated)
}

export const resumeAdvertisement = async (userId: string, adId: string) => {
  const business = await getBusinessForUser(userId)
  const ad = await advertisementRepo.findUnique({ where: { id: adId } })
  if (!ad || ad.businessId !== business.id) {
    throw new UnauthorizedError('Not authorized')
  }

  const now = new Date()
  let status = 'ACTIVE'
  if (ad.startDate > now) status = 'SCHEDULED'
  else if (ad.endDate < now) throw new ValidationError('Cannot resume expired advertisement')

  const updated = await advertisementRepo.update({
    where: { id: adId },
    data: { isActive: true, status },
  })
  return serializeAd(updated)
}

// ——— Business-owner events (delegates to business-events.service) ———

export async function getBusinessEvents(userId: string, status?: string) {
  const items = await ownerEvents.listBusinessEvents(
    userId,
    status as 'upcoming' | 'past' | 'drafts' | undefined
  )
  return { items }
}

export const createEvent = ownerEvents.createBusinessEvent
export const getEventStats = ownerEvents.getBusinessEventStats
export const getBusinessEventDetails = ownerEvents.getBusinessEvent
export const updateEvent = ownerEvents.updateBusinessEvent
export const deleteEvent = ownerEvents.deleteBusinessEvent
export const publishEvent = ownerEvents.publishBusinessEvent

export async function cancelEvent(userId: string, eventId: string, _reason?: string) {
  return ownerEvents.cancelBusinessEvent(userId, eventId)
}

export async function getEventAttendees(userId: string, eventId: string) {
  return ownerEvents.listEventAttendees(userId, eventId)
}

export async function checkInAttendee(
  userId: string,
  eventId: string,
  attendeeId?: string,
  qrCode?: string,
  method?: 'QR_CODE' | 'MANUAL'
) {
  const id = attendeeId?.trim()
  const scan = qrCode?.trim()
  if (id) {
    return ownerEvents.checkInAttendee(userId, eventId, id, method ?? 'MANUAL')
  }
  if (scan) {
    return ownerEvents.checkInFromScan(userId, eventId, scan)
  }
  throw new BadRequestError('attendeeId or qrCode is required')
}

export const getEventAnalytics = ownerEvents.getBusinessEventAnalytics
export const duplicateEvent = ownerEvents.duplicateBusinessEvent

export function checkInScan(userId: string, eventId: string, scan: string) {
  return ownerEvents.checkInFromScan(userId, eventId, scan)
}

export const removeAttendee = ownerEvents.removeAttendee
