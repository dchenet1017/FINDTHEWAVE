import { FastifyRequest, FastifyReply } from 'fastify'
import * as analyticsService from './analytics.service'
import { successResponse } from '../../../utils/response'
import { subDays } from 'date-fns'

interface AnalyticsQuery {
  startDate?: string
  endDate?: string
  period?: string
}

export const getOverview = async (request: FastifyRequest, reply: FastifyReply) => {
  const { startDate, endDate } = request.query as AnalyticsQuery
  
  const start = startDate ? new Date(startDate) : subDays(new Date(), 30)
  const end = endDate ? new Date(endDate) : new Date()

  const [
    stats, 
    userGrowth, 
    revenueData, 
    topWaveLeaders,
    topBusinesses,
    activeCommunities,
    bookingsByCategory
  ] = await Promise.all([
    analyticsService.getOverviewStats(start, end),
    analyticsService.getUserGrowthData(start, end),
    analyticsService.getRevenueData(start, end),
    analyticsService.getTopWaveLeaders(10),
    analyticsService.getTopBusinesses(10),
    analyticsService.getActiveCommunities(10),
    analyticsService.getBookingsByCategory(start, end)
  ])

  return reply.send(successResponse({
    stats,
    charts: {
      userGrowth,
      revenue: revenueData,
    },
    topWaveLeaders,
    topBusinesses,
    activeCommunities,
    bookingsByCategory
  }))
}

export const getUserAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  const { startDate, endDate } = request.query as AnalyticsQuery
  
  const start = startDate ? new Date(startDate) : subDays(new Date(), 30)
  const end = endDate ? new Date(endDate) : new Date()

  const userGrowth = await analyticsService.getUserGrowthData(start, end)

  // Get user demographics and activity data
  const [totalUsers, activeUsers, usersByRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLogin: {
          gte: subDays(new Date(), 7)
        }
      }
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
  ])

  return reply.send(successResponse({
    totalUsers,
    activeUsers,
    usersByRole: usersByRole.map(r => ({
      role: r.role,
      count: r._count
    })),
    userGrowth
  }))
}

export const getRevenueAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  const { startDate, endDate } = request.query as AnalyticsQuery
  
  const start = startDate ? new Date(startDate) : subDays(new Date(), 30)
  const end = endDate ? new Date(endDate) : new Date()

  const revenueData = await analyticsService.getRevenueData(start, end)

  // Calculate revenue metrics
  const revenue = await prisma.booking.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { 
        gte: start, 
        lte: end 
      }
    },
    _sum: {
      totalAmount: true,
      serviceFee: true
    },
    _avg: {
      totalAmount: true
    },
    _count: true
  })

  // Get revenue by WaveLeader
  const revenueByWaveLeader = await prisma.booking.groupBy({
    by: ['waveLeaderId'],
    where: {
      status: 'COMPLETED',
      createdAt: { 
        gte: start, 
        lte: end 
      }
    },
    _sum: {
      totalAmount: true
    },
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: 10
  })

  // Get WaveLeader details
  const waveLeaderIds = revenueByWaveLeader.map(r => r.waveLeaderId)
  const waveLeaders = await prisma.waveLeader.findMany({
    where: {
      id: { in: waveLeaderIds }
    },
    select: {
      id: true,
      displayName: true
    }
  })

  const waveLeaderMap = new Map(waveLeaders.map(wl => [wl.id, wl.displayName]))

  return reply.send(successResponse({
    totalRevenue: revenue._sum.totalAmount ? Number(revenue._sum.totalAmount) : 0,
    totalServiceFees: revenue._sum.serviceFee ? Number(revenue._sum.serviceFee) : 0,
    averageBookingValue: revenue._avg.totalAmount ? Number(revenue._avg.totalAmount) : 0,
    totalBookings: revenue._count,
    revenueChart: revenueData,
    topEarners: revenueByWaveLeader.map(r => ({
      waveLeaderId: r.waveLeaderId,
      displayName: waveLeaderMap.get(r.waveLeaderId) || 'Unknown',
      revenue: r._sum.totalAmount ? Number(r._sum.totalAmount) : 0
    }))
  }))
}

// Import prisma for the controller functions that need it
import { prisma } from '../../../lib/prisma'
