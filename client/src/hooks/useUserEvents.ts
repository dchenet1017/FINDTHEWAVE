import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/axios'
import type { MyEventRegistration, MyRegisteredEvent } from '@/types/event'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

function unwrap<T>(res: { data: ApiEnvelope<T> }, msg: string): T {
  const b = res.data
  if (!b.success || b.data === undefined) {
    throw new Error(b.error?.message || msg)
  }
  return b.data
}

export function useMyEvents(status?: 'upcoming' | 'past' | 'cancelled') {
  return useQuery<MyRegisteredEvent[]>({
    queryKey: ['user', 'events', status ?? 'all'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<MyRegisteredEvent[]>>('/users/me/events', {
        params: status ? { status } : undefined,
      })
      return unwrap(res, 'Failed to load your events')
    },
  })
}

export function useMyEventTicket(eventId: string | undefined) {
  return useQuery<MyEventRegistration | null>({
    queryKey: ['user', 'events', eventId, 'ticket'],
    queryFn: async () => {
      if (!eventId) return null
      try {
        const res = await api.get<ApiEnvelope<MyEventRegistration | null>>(
          `/events/${eventId}/my-registration`
        )
        const body = res.data
        if (!body.success) {
          throw new Error(body.error?.message || 'Failed to load ticket')
        }
        return body.data ?? null
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) return null
        throw e
      }
    },
    enabled: !!eventId,
    retry: false,
  })
}
