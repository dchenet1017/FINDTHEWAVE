import { prisma } from '../../../lib/prisma'
import { Prisma } from '@prisma/client'
import { subDays } from 'date-fns'

export const getOverviewStats = async (startDate: Date, endDate: Date) => {
  // Get counts in parallel for better performance
  const [
    totalUsers,
    newUsers,
    totalWaveLeaders,
    activeWaveLeaders,
    totalBusinesses,
    totalBookings,
    completedBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { 
        createdAt: { 
          gte: startDate, 
          lte: endDate 
        } 
      },
    }),
    prisma.waveLeader.count(),
    prisma.waveLeader.count({ 
      where: { isAvailable: true } 
    }),
    prisma.business.count({ 
      where: { approvalStatus: 'APPROVED' } 
    }),
    prisma.booking.count({
      where: { 
        createdAt: { 
          gte: startDate, 
          lte: endDate 
        } 
      },
    }),
    prisma.booking.count({
      where: { 
        status: 'COMPLETED',
        createdAt: { 
          gte: startDate, 
          lte: endDate 
        } 
      },
    }),
  ])

  // Calculate revenue
  const revenue = await prisma.booking.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { 
        gte: startDate, 
        lte: endDate 
      },
    },
    _sum: { 
      totalAmount: true 
    },
  })

  return {
    totalUsers,
    newUsers,
    totalWaveLeaders,
    activeWaveLeaders,
    totalBusinesses,
    totalBookings,
    completedBookings,
    totalRevenue: revenue._sum.totalAmount ? Number(revenue._sum.totalAmount) : 0,
  }
}

export const getUserGrowthData = async (startDate: Date, endDate: Date) => {
  // Get daily user counts for chart
  // Using raw query for date grouping
  const users = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
    FROM "User"
    WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `
  
  return users.map(row => ({
    date: row.date,
    count: Number(row.count)
  }))
}

export const getRevenueData = async (startDate: Date, endDate: Date) => {
  // Get daily revenue for chart
  const revenue = await prisma.$queryRaw<Array<{ date: Date; amount: Prisma.Decimal | null }>>`
    SELECT DATE("createdAt") as date, SUM("totalAmount") as amount
    FROM "Booking"
    WHERE status = 'COMPLETED'
      AND "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `
  
  return revenue.map(row => ({
    date: row.date,
    amount: row.amount ? Number(row.amount) : 0
  }))
}

export const getTopWaveLeaders = async (limit: number = 10) => {
  const waveLeaders = await prisma.waveLeader.findMany({
    take: limit,
    orderBy: { 
      totalBookings: 'desc' 
    },
    include: {
      user: {
        select: { 
          firstName: true, 
          lastName: true, 
          avatar: true 
        },
      },
    },
  })

  // Calculate total earnings for each WaveLeader
  const waveLeaderIds = waveLeaders.map(wl => wl.id)
  const earnings = await prisma.booking.groupBy({
    by: ['waveLeaderId'],
    where: {
      waveLeaderId: { in: waveLeaderIds },
      status: 'COMPLETED'
    },
    _sum: {
      totalAmount: true
    }
  })

  const earningsMap = new Map(
    earnings.map(e => [e.waveLeaderId, e._sum.totalAmount ? Number(e._sum.totalAmount) : 0])
  )

  return waveLeaders.map(wl => ({
    id: wl.id,
    displayName: wl.displayName,
    specialty: wl.specialty,
    rating: Number(wl.rating),
    totalBookings: wl.totalBookings,
    totalEarnings: earningsMap.get(wl.id) || 0,
    user: wl.user
  }))
}

export const getTopBusinesses = async (limit: number = 10) => {
  const businesses = await prisma.business.findMany({
    take: limit,
    where: {
      approvalStatus: 'APPROVED',
      isActive: true
    },
    orderBy: {
      checkIns: {
        _count: 'desc'
      }
    },
    select: {
      id: true,
      name: true,
      type: true,
      _count: {
        select: {
          checkIns: true
        }
      }
    }
  })

  return businesses.map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    checkIns: b._count.checkIns
  }))
}

export const getActiveCommunities = async (limit: number = 10) => {
  const communities = await prisma.community.findMany({
    take: limit,
    where: {
      isActive: true
    },
    orderBy: {
      totalMembers: 'desc'
    },
    select: {
      id: true,
      name: true,
      totalMembers: true,
      _count: {
        select: {
          members: {
            where: {
              joinedAt: {
                gte: subDays(new Date(), 30)
              }
            }
          }
        }
      }
    }
  })

  return communities.map(c => ({
    id: c.id,
    name: c.name,
    totalMembers: c.totalMembers,
    newMembers: c._count.members
  }))
}

export const getBookingsByCategory = async (startDate: Date, endDate: Date) => {
  const bookings = await prisma.booking.groupBy({
    by: ['waveLeaderId'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  })

  // Get WaveLeader specialties
  const waveLeaderIds = bookings.map(b => b.waveLeaderId)
  const waveLeaders = await prisma.waveLeader.findMany({
    where: {
      id: { in: waveLeaderIds }
    },
    select: {
      id: true,
      specialty: true
    }
  })

  const specialtyMap = new Map(waveLeaders.map(wl => [wl.id, wl.specialty]))
  
  // Group bookings by specialty
  const categoryCount: Record<string, number> = {}
  bookings.forEach(booking => {
    const specialty = specialtyMap.get(booking.waveLeaderId) || 'Other'
    categoryCount[specialty] = (categoryCount[specialty] || 0) + booking._count
  })

  return Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value
  }))
}
