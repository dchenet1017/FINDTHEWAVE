import { prisma } from '../../../lib/prisma'

const DAY_MS = 24 * 60 * 60 * 1000

/** Percent change from the previous window, rounded to one decimal */
function growth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

function fullName(u: { firstName: string | null; lastName: string | null; email: string }) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return name || u.email.split('@')[0]
}

/**
 * Everything the admin home page shows, computed from real rows. Replaces a
 * client-side generator that invented every figure, which would have been
 * presented as fact to pilot partners.
 */
export async function getDashboard() {
  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * DAY_MS)
  const d60 = new Date(now.getTime() - 60 * DAY_MS)
  const d7 = new Date(now.getTime() - 7 * DAY_MS)

  const [
    totalUsers,
    users30,
    usersPrev30,
    activeWaveLeaders,
    leaders30,
    leadersPrev30,
    totalBusinesses,
    businesses30,
    businessesPrev30,
    revenue30,
    revenuePrev30,
    pendingBusinesses,
    pendingWaveLeaders,
    signups,
    paidBookings,
    recentUsers,
    recentPendingBusinesses,
    recentBookings,
    recentReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.waveLeader.count({ where: { isAvailable: true, user: { isActive: true } } }),
    prisma.waveLeader.count({ where: { createdAt: { gte: d30 } } }),
    prisma.waveLeader.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.business.count({ where: { approvalStatus: 'APPROVED', isActive: true } }),
    prisma.business.count({ where: { createdAt: { gte: d30 } } }),
    prisma.business.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { paidAt: { gte: d30 } } }),
    prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { paidAt: { gte: d60, lt: d30 } } }),
    prisma.business.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.waveLeader.count({ where: { isVerified: false } }),
    prisma.user.findMany({ where: { createdAt: { gte: d30 } }, select: { createdAt: true } }),
    prisma.booking.findMany({
      where: { paidAt: { gte: d7 } },
      select: { paidAt: true, totalAmount: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true, createdAt: true },
    }),
    prisma.business.findMany({
      where: { approvalStatus: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
        waveLeader: { select: { displayName: true } },
      },
    }),
    prisma.booking.findMany({
      where: { reviewedAt: { not: null } },
      orderBy: { reviewedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        reviewedAt: true,
        rating: true,
        user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
        waveLeader: { select: { displayName: true } },
      },
    }),
  ])

  // Sign-ups per day for the last 30 days, zero-filled
  const signupsByDay = new Map<string, number>()
  for (const u of signups) signupsByDay.set(dayKey(u.createdAt), (signupsByDay.get(dayKey(u.createdAt)) ?? 0) + 1)
  const userChartData = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(now.getTime() - (29 - i) * DAY_MS)
    return {
      name: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: signupsByDay.get(dayKey(day)) ?? 0,
    }
  })

  // Booking revenue per day for the last 7 days, zero-filled
  const revenueByDay = new Map<string, number>()
  for (const b of paidBookings) {
    if (!b.paidAt) continue
    revenueByDay.set(dayKey(b.paidAt), (revenueByDay.get(dayKey(b.paidAt)) ?? 0) + Number(b.totalAmount))
  }
  const revenueChartData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now.getTime() - (6 - i) * DAY_MS)
    return {
      name: day.toLocaleDateString('en-US', { weekday: 'short' }),
      value: Math.round((revenueByDay.get(dayKey(day)) ?? 0) * 100) / 100,
    }
  })

  const recentActivity = [
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      type: 'user_registered' as const,
      description: `${fullName(u)} registered a new account`,
      timestamp: u.createdAt,
      user: { name: fullName(u), avatar: u.avatar ?? undefined },
    })),
    ...recentPendingBusinesses.map((b) => ({
      id: `business-${b.id}`,
      type: 'business_pending' as const,
      description: `${b.name} is pending approval`,
      timestamp: b.createdAt,
      user: { name: b.name, avatar: undefined },
    })),
    ...recentBookings.map((b) => ({
      id: `booking-${b.id}`,
      type: 'booking_created' as const,
      description: `${fullName(b.user)} booked ${b.waveLeader.displayName}`,
      timestamp: b.createdAt,
      user: { name: fullName(b.user), avatar: b.user.avatar ?? undefined },
    })),
    ...recentReviews.map((b) => ({
      id: `review-${b.id}`,
      type: 'review_posted' as const,
      description: `${fullName(b.user)} rated ${b.waveLeader.displayName} ${b.rating}/5`,
      timestamp: b.reviewedAt as Date,
      user: { name: fullName(b.user), avatar: b.user.avatar ?? undefined },
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)
    .map((a) => ({ ...a, timestamp: a.timestamp.toISOString() }))

  const monthlyRevenue = Number(revenue30._sum.totalAmount ?? 0)

  return {
    totalUsers,
    userGrowth: growth(users30, usersPrev30),
    activeWaveLeaders,
    waveLeaderGrowth: growth(leaders30, leadersPrev30),
    totalBusinesses,
    businessGrowth: growth(businesses30, businessesPrev30),
    monthlyRevenue,
    revenueGrowth: growth(monthlyRevenue, Number(revenuePrev30._sum.totalAmount ?? 0)),
    userChartData,
    revenueChartData,
    recentActivity,
    pendingBusinesses,
    // There is no content-flagging model yet, so nothing can be flagged
    flaggedContent: 0,
    pendingWaveLeaders,
  }
}
