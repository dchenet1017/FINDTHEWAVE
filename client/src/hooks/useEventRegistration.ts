import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import api from '@/lib/axios'
import type { Event, MyEventRegistration } from '@/types/event'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { code?: string; message?: string } }

function unwrapDetail(res: { data: ApiEnvelope<Event> }, fallback: string): Event {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

function unwrapRegistration(res: { data: ApiEnvelope<MyEventRegistration | null> }): MyEventRegistration | null {
  const body = res.data
  if (!body.success) {
    throw new Error(body.error?.message || 'Failed to load registration')
  }
  return body.data ?? null
}

export const useEventDetails = (eventId: string | undefined) => {
  return useQuery<Event>({
    queryKey: ['events', 'detail', eventId],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<Event>>(`/events/${eventId}`)
      const event = unwrapDetail(res, 'Event not found')
      void api.post(`/events/${eventId}/view`).catch(() => {
        /* non-fatal */
      })
      return event
    },
    enabled: !!eventId,
    retry: false,
  })
}

export const useSimilarEvents = (eventId: string | undefined) => {
  return useQuery<{ items: Event[] }>({
    queryKey: ['events', 'similar', eventId],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: Event[] }>>(`/events/${eventId}/similar`)
      const body = res.data
      if (!body.success || !body.data) throw new Error(body.error?.message || 'Failed to load')
      return body.data
    },
    enabled: !!eventId,
    staleTime: 60_000,
  })
}

export const useMyEventRegistration = (eventId: string | undefined, enabled: boolean) => {
  return useQuery<MyEventRegistration | null>({
    queryKey: ['events', 'registration', eventId],
    queryFn: async () => {
      try {
        const res = await api.get<ApiEnvelope<MyEventRegistration | null>>(
          `/events/${eventId}/my-registration`
        )
        return unwrapRegistration(res)
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) return null
        throw e
      }
    },
    enabled: !!eventId && enabled,
    retry: false,
  })
}

export const useRegisterForEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { eventId: string; tickets: number; waitlist?: boolean }) => {
      const res = await api.post<ApiEnvelope<MyEventRegistration>>(`/events/${vars.eventId}/register`, {
        tickets: vars.tickets,
        waitlist: vars.waitlist === true,
      })
      const body = res.data
      if (!body.success || body.data === undefined) {
        throw new Error(body.error?.message || 'Registration failed')
      }
      return body.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'registration', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'events', variables.eventId, 'ticket'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['events', 'similar', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(
        variables.waitlist ? "You're on the waitlist!" : 'Successfully registered for this event!'
      )
    },
    onError: (e: unknown) => {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error?.message
          ? String(e.response.data.error.message)
          : e instanceof Error
            ? e.message
            : 'Registration failed'
      toast.error(msg)
    },
  })
}

export const useCancelEventRegistration = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await api.delete<ApiEnvelope<{ cancelled: boolean }>>(`/events/${eventId}/register`)
      const body = res.data
      if (!body.success) {
        throw new Error(body.error?.message || 'Cancel failed')
      }
      return body.data
    },
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'registration', eventId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'events', eventId, 'ticket'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['events', 'similar', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Registration cancelled')
    },
    onError: (e: unknown) => {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error?.message
          ? String(e.response.data.error.message)
          : e instanceof Error
            ? e.message
            : 'Could not cancel'
      toast.error(msg)
    },
  })
}
