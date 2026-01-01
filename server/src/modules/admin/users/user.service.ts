import { prisma } from '../../../lib/prisma'
import { NotFoundError, ValidationError } from '../../../utils/errors'
import { Prisma } from '@prisma/client'

interface GetUsersParams {
  page: number
  limit: number
  search?: string
  role?: string
  status?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const getUsers = async (params: GetUsersParams) => {
  const { page, limit, search, role, status, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.UserWhereInput = {}

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (role && role !== 'all') {
    where.role = role as any
  }

  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  } else if (status === 'unverified') {
    where.isVerified = false
  }

  // Get total count
  const total = await prisma.user.count({ where })

  // Validate and map sortBy field
  const validSortFields: Record<string, string> = {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    lastLogin: 'lastLogin',
  }

  const sortField = validSortFields[sortBy] || 'createdAt'

  // Get users
  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortField]: sortOrder },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      isVerified: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      // Include related counts
      _count: {
        select: {
          bookings: true,
          checkIns: true,
        },
      },
    },
  })

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      role: true,
      isVerified: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      waveLeader: true,
      business: true,
      _count: {
        select: {
          bookings: true,
          checkIns: true,
          communityMemberships: true,
        },
      },
    },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return user
}

export const updateUser = async (id: string, data: any) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    throw new NotFoundError('User not found')
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      avatar: data.avatar,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  })

  return user
}

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  await prisma.user.delete({ where: { id } })
}

export const suspendUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  })
}

export const activateUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  })
}

export const verifyUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return prisma.user.update({
    where: { id },
    data: { isVerified: true, verificationToken: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  })
}

export const changeUserRole = async (id: string, role: string) => {
  const validRoles = ['USER', 'WAVELEADER', 'BUSINESS', 'ADMIN']

  if (!validRoles.includes(role)) {
    throw new ValidationError('Invalid role')
  }

  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return prisma.user.update({
    where: { id },
    data: { role: role as any },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  })
}

export const bulkAction = async (action: string, userIds: string[]) => {
  if (userIds.length === 0) {
    throw new ValidationError('No user IDs provided')
  }

  // Verify all users exist
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  })

  if (users.length !== userIds.length) {
    throw new NotFoundError('One or more users not found')
  }

  let result

  switch (action) {
    case 'activate':
      result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: true },
      })
      break

    case 'suspend':
      result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: false },
      })
      break

    case 'delete':
      result = await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      })
      break

    case 'verify':
      result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isVerified: true, verificationToken: null },
      })
      break

    default:
      throw new ValidationError('Invalid action')
  }

  return { affected: result.count }
}

