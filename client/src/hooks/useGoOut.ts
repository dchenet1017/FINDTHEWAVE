import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

export interface GoOutStatus {
  isActive: boolean
  latitude: number | null
  longitude: number | null
  expiresAt: string | null
}

function unwrap<T>(res: { data: ApiEnvelope<T> }, fallback: string): T {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

export const useGoOutStatus = () => {
  return useQuery<GoOutStatus>({
    queryKey: ['go-out', 'status'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<GoOutStatus>>('/go-out/status')
      return unwrap(res, 'Failed to load status')
    },
    staleTime: 30 * 1000,
  })
}

export const useActivateGoOut = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { latitude: number; longitude: number; durationMinutes: number }) => {
      const res = await api.post<ApiEnvelope<GoOutStatus>>('/go-out/activate', vars)
      return unwrap(res, 'Failed to go out')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['go-out', 'status'] })
      toast.success("You're now visible to nearby businesses")
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not activate Go Out')
    },
  })
}

export const useDeactivateGoOut = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiEnvelope<GoOutStatus>>('/go-out/deactivate')
      return unwrap(res, 'Failed to deactivate')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['go-out', 'status'] })
      toast.success('Go Out turned off')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not deactivate Go Out')
    },
  })
}
