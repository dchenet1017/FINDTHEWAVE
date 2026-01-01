import { prisma } from '../../lib/prisma'
import { ApprovalStatus, BusinessType, Prisma } from '@prisma/client'
import { ForbiddenError, NotFoundError } from '../../utils/errors'

let postgisEnabled = false
const ensurePostgis = async () => {
  if (postgisEnabled) return
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis')
    postgisEnabled = true
  } catch (err) {
    // Ignore if extension cannot be created, queries will fail and surface error
    console.error('PostGIS enable failed:', err)
  }
}

interface ListParams {
  page?: number
  limit?: number
  search?: string
  type?: BusinessType | BusinessType[] | string
  status?: ApprovalStatus | string
  city?: string
  state?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface NearbyParams {
  lat: number
  lng: number
  radius?: number // miles
  types?: BusinessType[]
  limit?: number
}

interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

export const businessService = {
  async getBusinesses(params: ListParams) {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      status,
      city,
      state,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params

    const skip = (page - 1) * limit

    const where: Prisma.BusinessWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type && type !== '') {
      if (Array.isArray(type)) {
        where.type = { in: type }
      } else if (typeof type === 'string' && type.includes(',')) {
        where.type = { in: type.split(',') as BusinessType[] }
      } else {
        where.type = type as BusinessType
      }
    }

    if (status && status !== '') {
      where.approvalStatus = status as ApprovalStatus
    }

    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (state) where.state = { contains: state, mode: 'insensitive' }

    const total = await prisma.business.count({ where })

    const validSort: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      name: 'name',
      city: 'city',
    }
    const sortField = validSort[sortBy] || 'createdAt'

    const items = await prisma.business.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: sortOrder },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
        },
        _count: { select: { promotions: true, events: true, checkIns: true } },
      },
    })

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getNearbyBusinesses(params: NearbyParams) {
    await ensurePostgis()
    const { lat, lng, radius = 5, types, limit = 50 } = params
    const radiusMeters = radius * 1609.34
    const typeFilter = types && types.length ? `AND b."type" IN (${types.map((_, i) => `$${i + 4}`).join(',')})` : ''
    const bindings: any[] = [lng, lat, radiusMeters]
    if (types && types.length) bindings.push(...types)

    const results = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        b.*,
        ST_Distance(
          ST_MakePoint(b.longitude::float, b.latitude::float)::geography,
          ST_MakePoint($1, $2)::geography
        ) / 1609.34 AS distance
      FROM "Business" b
      WHERE ST_DWithin(
        ST_MakePoint(b.longitude::float, b.latitude::float)::geography,
        ST_MakePoint($1, $2)::geography,
        $3
      )
      ${typeFilter}
      ORDER BY distance ASC
      LIMIT ${limit}
    `,
      ...bindings
    )

    return results.map((b) => ({
      ...b,
      distance: typeof b.distance === 'string' ? parseFloat(b.distance) : b.distance,
    }))
  },

  async searchBusinesses(searchTerm: string, location?: { lat: number; lng: number }) {
    if (!searchTerm) return []

    if (location) {
      await ensurePostgis()
      const { lat, lng } = location
      const results = await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          b.*,
          ST_Distance(
            ST_MakePoint(b.longitude::float, b.latitude::float)::geography,
            ST_MakePoint($1, $2)::geography
          ) / 1609.34 AS distance
        FROM "Business" b
        WHERE (
          b.name ILIKE $3 OR b.description ILIKE $3 OR b.city ILIKE $3 OR b.state ILIKE $3
        )
        ORDER BY distance ASC
        LIMIT 50
      `,
        lng,
        lat,
        `%${searchTerm}%`
      )
      return results
    }

    return prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { state: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 50,
    })
  },

  async getBusinessesInBounds(bounds: Bounds) {
    const { north, south, east, west } = bounds
    return prisma.business.findMany({
      where: {
        latitude: { gte: south, lte: north },
        longitude: { gte: west, lte: east },
      },
      take: 500,
      select: {
        id: true,
        name: true,
        type: true,
        latitude: true,
        longitude: true,
        approvalStatus: true,
        isVerified: true,
      },
    })
  },

  async getBusinessTypeCounts() {
    const groups = await prisma.business.groupBy({
      by: ['type'],
      _count: { _all: true },
    })
    return groups.map((g) => ({ type: g.type, count: g._count._all }))
  },

  getBusinessById(id: string) {
    return prisma.business.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        promotions: true,
      },
    })
  },

  getBusinessByUserId(userId: string) {
    return prisma.business.findUnique({
      where: { userId },
      include: { promotions: true },
    })
  },

  async createBusiness(userId: string, data: any) {
    const business = await prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          type: data.type,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          latitude: new Prisma.Decimal(data.latitude),
          longitude: new Prisma.Decimal(data.longitude),
          phone: data.phone,
          website: data.website,
          images: data.images || [],
          approvalStatus: ApprovalStatus.PENDING,
        },
      })

      // set role to BUSINESS if not already
      await tx.user.update({
        where: { id: userId },
        data: { role: 'BUSINESS' },
      })

      return created
    })

    return business
  },

  async updateBusiness(id: string, userId: string, role: string, data: any) {
    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) throw new NotFoundError('Business not found')
    if (business.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenError('You do not own this business')
    }

    return prisma.business.update({
      where: { id },
      data: {
        ...data,
        latitude: data.latitude !== undefined ? new Prisma.Decimal(data.latitude) : undefined,
        longitude: data.longitude !== undefined ? new Prisma.Decimal(data.longitude) : undefined,
      },
    })
  },

  async deleteBusiness(id: string, userId: string, role: string) {
    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) throw new NotFoundError('Business not found')
    if (business.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenError('You do not own this business')
    }

    await prisma.business.delete({ where: { id } })
    return true
  },

  async createPromotion(businessId: string, userId: string, role: string, data: any) {
    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) throw new NotFoundError('Business not found')
    if (business.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenError('You do not own this business')
    }

    return prisma.promotion.create({
      data: {
        businessId,
        title: data.title,
        description: data.description,
        discount: data.discount || '0%',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
      },
    })
  },
}

