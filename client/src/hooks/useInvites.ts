import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

export interface InviteRow {
  id: string
  businessId: string
  userId: string
  goOutStatusId: string | null
  promotionId: string | null
  title: string
  message: string
  status: string
  sentAt: string
  respondedAt: string | null
  business?: { id: string; name: string; images?: string[] }
}

function unwrap<T>(res: { data: ApiEnvelope<T> }, fallback: string): T {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

export const useMyInvites = () => {
  return useQuery<{ items: InviteRow[] }>({
    queryKey: ['invites', 'received'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: InviteRow[] }>>('/invites')
      return unwrap(res, 'Failed to load invites')
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}

export const useAcceptInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiEnvelope<InviteRow>>(`/invites/${id}/accept`)
      return unwrap(res, 'Failed to accept invite')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Invite accepted')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not accept invite')
    },
  })
}

export const useDeclineInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiEnvelope<InviteRow>>(`/invites/${id}/decline`)
      return unwrap(res, 'Failed to decline invite')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Invite declined')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not decline invite')
    },
  })
}
