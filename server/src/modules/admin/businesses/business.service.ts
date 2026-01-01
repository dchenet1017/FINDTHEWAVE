import { prisma } from '../../../lib/prisma'
import { NotFoundError, ValidationError } from '../../../utils/errors'
import { Prisma } from '@prisma/client'

interface GetBusinessesParams {
  page: number
  limit: number
  search?: string
  type?: string
  status?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const getBusinesses = async (params: GetBusinessesParams) => {
  const { page, limit, search, type, status, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.BusinessWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      { state: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (type && type !== 'all') {
    where.type = type as any
  }

  if (status && status !== 'all') {
    where.approvalStatus = status as any
  }

  // Get total count
  const total = await prisma.business.count({ where })

  // Validate and map sortBy field
  const validSortFields: Record<string, string> = {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    name: 'name',
    city: 'city',
  }

  const sortField = validSortFields[sortBy] || 'createdAt'

  // Get businesses with owner info
  const businesses = await prisma.business.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortField]: sortOrder },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          promotions: true,
          events: true,
          checkIns: true,
        },
      },
    },
  })

  return {
    businesses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const getBusinessById = async (id: string) => {
  const business = await prisma.business.findUnique({
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
      promotions: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      events: {
        take: 5,
        orderBy: { startDate: 'desc' },
      },
      _count: {
        select: {
          promotions: true,
          events: true,
          checkIns: true,
        },
      },
    },
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  return business
}

export const approveBusiness = async (id: string, adminId: string, notes?: string) => {
  const business = await prisma.business.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  const updatedBusiness = await prisma.business.update({
    where: { id },
    data: {
      approvalStatus: 'APPROVED',
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // TODO: Send approval email to business owner
  // TODO: Create notification for business owner

  return updatedBusiness
}

export const rejectBusiness = async (
  id: string,
  reason: string,
  adminId: string,
  notes?: string
) => {
  const business = await prisma.business.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  const updatedBusiness = await prisma.business.update({
    where: { id },
    data: {
      approvalStatus: 'REJECTED',
      isActive: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // TODO: Send rejection email with reason
  // TODO: Create notification

  return updatedBusiness
}

export const updateBusiness = async (id: string, data: any) => {
  const business = await prisma.business.findUnique({
    where: { id },
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  return prisma.business.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      phone: data.phone,
      website: data.website,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export const deleteBusiness = async (id: string) => {
  const business = await prisma.business.findUnique({
    where: { id },
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  await prisma.business.delete({ where: { id } })
}

export const getPendingCount = async () => {
  return prisma.business.count({
    where: {
      approvalStatus: 'PENDING',
    },
  })
}


