import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communityService, type Community, type CommunityDetail, type CommunityMembersResponse } from '@/services/community.service'
import { userService } from '@/services/user.service'

export const useCommunities = () => {
  return useQuery<Community[]>({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data } = await communityService.list()
      if (data.success && data.data) {
        return data.data
      }
      return []
    },
  })
}

export const useCommunity = (id: string | undefined) => {
  return useQuery<CommunityDetail>({
    queryKey: ['community', id],
    queryFn: async () => {
      if (!id) throw new Error('Community ID required')
      const { data } = await communityService.getById(id)
      if (data.success && data.data) {
        return data.data
      }
      throw new Error('Failed to load community')
    },
    enabled: !!id,
  })
}

export const useCommunityMembers = (id: string | undefined, page = 1, limit = 20) => {
  return useQuery<CommunityMembersResponse>({
    queryKey: ['community', id, 'members', page, limit],
    queryFn: async () => {
      if (!id) throw new Error('Community ID required')
      const { data } = await communityService.getMembers(id, page, limit)
      if (data.success && data.data) {
        return data.data
      }
      return {
        members: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
    },
    enabled: !!id,
  })
}

export const useJoinCommunity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (communityId: string) => {
      const { data } = await communityService.join(communityId)
      if (!data.success) {
        throw new Error('Failed to join community')
      }
      return communityId
    },
    onSuccess: (communityId) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['community', communityId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'communities'] })
      toast.success('Successfully joined community!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to join community')
    },
  })
}

export const useLeaveCommunity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (communityId: string) => {
      const { data } = await communityService.leave(communityId)
      if (!data.success) {
        throw new Error('Failed to leave community')
      }
      return communityId
    },
    onSuccess: (communityId) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['community', communityId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'communities'] })
      toast.success('Left community')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to leave community')
    },
  })
}

export const useMyCommunities = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['user', 'communities'],
    queryFn: async () => {
      try {
        const { data } = await userService.getMyCommunities()
        if (data.success && data.data) {
          return data.data
        }
        return []
      } catch {
        return []
      }
    },
    staleTime: 1 * 60 * 1000,
    enabled: options?.enabled !== false,
  })
}

export const useMyCommunitiesIds = () => {
  const { data: communities = [] } = useMyCommunities()
  return communities.map((c: { id: string }) => c.id)
}
