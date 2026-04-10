import api from '@/lib/axios'

export interface Community {
  id: string
  name: string
  description: string
  icon: string
  color: string
  totalMembers: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CommunityDetail extends Community {
  waveLeadersCount?: number
  isMember?: boolean
  waveLeaders?: Array<{
    id: string
    displayName: string
    specialty: string
    rating: number
    isAvailable: boolean
    avatar?: string | null
  }>
}

export interface CommunityMember {
  id: string
  userId: string
  joinedAt: string
  isAvailable?: boolean
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
    role: string
    displayName: string
    waveLeader?: {
      id: string
      displayName: string
      isVerified: boolean
    }
  }
}

export interface CommunityMembersResponse {
  members: CommunityMember[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const communityService = {
  list: () =>
    api.get<{ success: boolean; data?: Community[] }>('/communities'),

  getById: (id: string) =>
    api.get<{ success: boolean; data?: CommunityDetail }>(`/communities/${id}`),

  getMembers: (id: string, page = 1, limit = 20) =>
    api.get<{ success: boolean; data?: CommunityMembersResponse }>(
      `/communities/${id}/members`,
      { params: { page, limit } }
    ),

  getWaveLeaders: (id: string) =>
    api.get<{
      success: boolean
      data?: Array<{
        id: string
        displayName: string
        specialty: string
        rating: number
        isAvailable: boolean
        isVerified: boolean
        avatar?: string | null
        assignedAt: string
      }>
    }>(`/communities/${id}/waveleaders`),

  join: (id: string) =>
    api.post<{ success: boolean; data?: { success: boolean; message: string } }>(
      `/communities/${id}/join`
    ),

  leave: (id: string) =>
    api.post<{ success: boolean; data?: { success: boolean; message: string } }>(
      `/communities/${id}/leave`
    ),
}
