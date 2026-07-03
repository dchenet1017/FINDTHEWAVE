import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

export interface NotificationRow {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

function unwrap<T>(res: { data: ApiEnvelope<T> }, fallback: string): T {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

export const useNotifications = () => {
  return useQuery<{ items: NotificationRow[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: NotificationRow[]; unreadCount: number }>>(
        '/notifications'
      )
      return unwrap(res, 'Failed to load notifications')
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiEnvelope<NotificationRow>>(`/notifications/${id}/read`)
      return unwrap(res, 'Failed to mark as read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiEnvelope<{ success: boolean }>>('/notifications/read-all')
      return unwrap(res, 'Failed to mark all as read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
