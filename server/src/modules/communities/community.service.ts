import { prisma } from '../../lib/prisma'
import { NotFoundError, ConflictError } from '../../utils/errors'

export const communityService = {
  /**
   * List all active communities
   */
  async getAllCommunities() {
    const communities = await prisma.community.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        totalMembers: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
            waveLeaders: true,
          },
        },
      },
    })

    return communities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      totalMembers: c._count.members,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  },

  /**
   * Get community by id (optional userId for isMember)
   */
  async getCommunityById(id: string, userId?: string) {
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            waveLeaders: true,
          },
        },
        waveLeaders: {
          include: {
            waveLeader: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!community || !community.isActive) {
      throw new NotFoundError('Community not found')
    }

    let isMember = false
    if (userId) {
      const membership = await prisma.communityMembership.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId: id,
          },
        },
      })
      isMember = !!membership
    }

    return {
      id: community.id,
      name: community.name,
      description: community.description,
      icon: community.icon,
      color: community.color,
      totalMembers: community._count.members,
      waveLeadersCount: community._count.waveLeaders,
      isActive: community.isActive,
      isMember,
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
      waveLeaders: community.waveLeaders.map((cl) => ({
        id: cl.waveLeader.id,
        displayName: cl.waveLeader.displayName,
        specialty: cl.waveLeader.specialty,
        rating: Number(cl.waveLeader.rating),
        isAvailable: cl.waveLeader.isAvailable,
        avatar: cl.waveLeader.user?.avatar,
      })),
    }
  },

  /**
   * Get community members with pagination
   */
  async getCommunityMembers(
    communityId: string,
    params: { page: number; limit: number }
  ) {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    })

    if (!community) {
      throw new NotFoundError('Community not found')
    }

    const [members, total] = await Promise.all([
      prisma.communityMembership.findMany({
        where: { communityId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
              waveLeader: {
                select: {
                  id: true,
                  displayName: true,
                  isVerified: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
      }),
      prisma.communityMembership.count({ where: { communityId } }),
    ])

    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        joinedAt: m.joinedAt.toISOString(),
        isAvailable: m.isAvailable,
        user: {
          id: m.user.id,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          avatar: m.user.avatar,
          role: m.user.role,
          displayName: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || 'Anonymous',
          waveLeader: m.user.waveLeader,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Get WaveLeaders assigned to community
   */
  async getCommunityWaveLeaders(communityId: string) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    })

    if (!community) {
      throw new NotFoundError('Community not found')
    }

    const waveLeaders = await prisma.communityWaveLeader.findMany({
      where: { communityId },
      include: {
        waveLeader: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        waveLeader: {
          rating: 'desc',
        },
      },
    })

    return waveLeaders.map((cl) => ({
      id: cl.waveLeader.id,
      displayName: cl.waveLeader.displayName,
      specialty: cl.waveLeader.specialty,
      rating: Number(cl.waveLeader.rating),
      isAvailable: cl.waveLeader.isAvailable,
      isVerified: cl.waveLeader.isVerified,
      avatar: cl.waveLeader.user?.avatar,
      assignedAt: cl.assignedAt.toISOString(),
    }))
  },

  /**
   * Join community
   */
  async joinCommunity(userId: string, communityId: string) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community || !community.isActive) {
      throw new NotFoundError('Community not found')
    }

    const existing = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    })

    if (existing) {
      throw new ConflictError('Already a member of this community')
    }

    const membership = await prisma.communityMembership.create({
      data: {
        userId,
        communityId,
        isAvailable: false,
      },
    })

    await prisma.community.update({
      where: { id: communityId },
      data: {
        totalMembers: {
          increment: 1,
        },
      },
    })

    return {
      id: membership.id,
      userId: membership.userId,
      communityId: membership.communityId,
      joinedAt: membership.joinedAt.toISOString(),
    }
  },

  /**
   * Leave community
   */
  async leaveCommunity(userId: string, communityId: string) {
    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    })

    if (!membership) {
      throw new NotFoundError('Not a member of this community')
    }

    await prisma.communityMembership.delete({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    })

    await prisma.community.update({
      where: { id: communityId },
      data: {
        totalMembers: {
          decrement: 1,
        },
      },
    })
  },

  /**
   * Update member availability
   */
  async updateMemberAvailability(
    userId: string,
    communityId: string,
    isAvailable: boolean
  ) {
    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    })

    if (!membership) {
      throw new NotFoundError('Not a member of this community')
    }

    return prisma.communityMembership.update({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      data: { isAvailable },
    })
  },
}
