import { prisma } from '../../../lib/prisma'
import { NotFoundError, ValidationError } from '../../../utils/errors'
import { Prisma } from '@prisma/client'

interface GetWaveLeadersParams {
  page: number
  limit: number
  search?: string
  status?: 'all' | 'pending' | 'verified' | 'suspended'
  specialty?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const getWaveLeaders = async (params: GetWaveLeadersParams) => {
  const { 
    page, 
    limit, 
    search, 
    status = 'all', 
    specialty, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = params
  
  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.WaveLeaderWhereInput = {}

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (specialty && specialty !== 'all') {
    where.specialty = specialty
  }

  // Status filters
  if (status === 'pending') {
    where.isVerified = false
  } else if (status === 'verified') {
    where.isVerified = true
    where.isAvailable = true
  } else if (status === 'suspended') {
    where.isAvailable = false
  }

  // Get total count
  const total = await prisma.waveLeader.count({ where })

  // Get WaveLeaders
  const waveLeaders = await prisma.waveLeader.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
        },
      },
    },
  })

  // Calculate earnings for each WaveLeader
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

  // Get stats
  const [verified, pending] = await Promise.all([
    prisma.waveLeader.count({ where: { isVerified: true } }),
    prisma.waveLeader.count({ where: { isVerified: false } })
  ])

  return {
    waveLeaders: waveLeaders.map(wl => ({
      ...wl,
      rating: Number(wl.rating),
      hourlyRate: Number(wl.hourlyRate),
      totalEarnings: earningsMap.get(wl.id) || 0
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      verified,
      pending
    }
  }
}

export const getWaveLeaderById = async (id: string) => {
  const waveLeader = await prisma.waveLeader.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
        },
      },
      bookings: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      communityAssignments: {
        include: {
          community: true,
        },
      },
    },
  })

  if (!waveLeader) {
    throw new NotFoundError('WaveLeader not found')
  }

  // Calculate total earnings
  const earnings = await prisma.booking.aggregate({
    where: {
      waveLeaderId: id,
      status: 'COMPLETED'
    },
    _sum: {
      totalAmount: true
    }
  })

  // Get reviews
  const reviews = await prisma.booking.findMany({
    where: {
      waveLeaderId: id,
      rating: { not: null },
      review: { not: null }
    },
    select: {
      id: true,
      rating: true,
      review: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return {
    ...waveLeader,
    rating: Number(waveLeader.rating),
    hourlyRate: Number(waveLeader.hourlyRate),
    totalEarnings: earnings._sum.totalAmount ? Number(earnings._sum.totalAmount) : 0,
    recentBookings: waveLeader.bookings.map(b => ({
      ...b,
      totalAmount: Number(b.totalAmount),
      serviceFee: Number(b.serviceFee)
    })),
    reviews: reviews.map(r => ({
      ...r,
      rating: r.rating || 0,
      comment: r.review || ''
    })),
    communities: waveLeader.communityAssignments.map(ca => ({
      id: ca.community.id,
      name: ca.community.name,
      assignedAt: ca.assignedAt
    }))
  }
}

export const updateWaveLeader = async (id: string, data: any) => {
  const waveLeader = await prisma.waveLeader.update({
    where: { id },
    data: {
      displayName: data.displayName,
      specialty: data.specialty,
      description: data.description,
      hourlyRate: data.hourlyRate,
      tags: data.tags,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  })
  
  return waveLeader
}

export const verifyWaveLeader = async (id: string) => {
  const waveLeader = await prisma.waveLeader.update({
    where: { id },
    data: {
      isVerified: true,
      isAvailable: true,
    },
  })

  // TODO: Send verification email
  // TODO: Create notification

  return waveLeader
}

export const suspendWaveLeader = async (id: string) => {
  const waveLeader = await prisma.waveLeader.update({
    where: { id },
    data: {
      isAvailable: false,
    },
  })

  // TODO: Send suspension email
  // TODO: Create notification

  return waveLeader
}

export const activateWaveLeader = async (id: string) => {
  const waveLeader = await prisma.waveLeader.update({
    where: { id },
    data: {
      isAvailable: true,
    },
  })

  return waveLeader
}

export const deleteWaveLeader = async (id: string) => {
  // Check for active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      waveLeaderId: id,
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    }
  })

  if (activeBookings > 0) {
    throw new ValidationError('Cannot delete WaveLeader with active bookings')
  }

  await prisma.waveLeader.delete({
    where: { id }
  })
}
