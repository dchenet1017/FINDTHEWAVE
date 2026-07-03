import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { InviteRow } from '@/hooks/useInvites'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

export interface NearbyGoOutUser {
  goOutStatusId: string
  userId: string
  user: { id: string; firstName: string | null; lastName: string | null; avatar: string | null }
  distanceMiles: number
  activatedAt: string
  expiresAt: string
}

function unwrap<T>(res: { data: ApiEnvelope<T> }, fallback: string): T {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

export const useNearbyGoOutUsers = (radius = 10, enabled = true) => {
  return useQuery<{ items: NearbyGoOutUser[] }>({
    queryKey: ['go-out', 'nearby', radius],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: NearbyGoOutUser[] }>>('/go-out/nearby', {
        params: { radius },
      })
      return unwrap(res, 'Failed to load nearby users')
    },
    enabled,
    refetchInterval: enabled ? 20_000 : false,
    staleTime: 10_000,
  })
}

export const useSendInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: {
      userId: string
      title: string
      message: string
      promotionId?: string
      goOutStatusId?: string
    }) => {
      const res = await api.post<ApiEnvelope<InviteRow>>('/invites', vars)
      return unwrap(res, 'Failed to send invite')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', 'sent'] })
      toast.success('Invite sent!')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not send invite')
    },
  })
}

export const useSentInvites = () => {
  return useQuery<{ items: InviteRow[] }>({
    queryKey: ['invites', 'sent'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: InviteRow[] }>>('/invites/sent')
      return unwrap(res, 'Failed to load sent invites')
    },
    staleTime: 15_000,
  })
}
