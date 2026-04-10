import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { Event, EventCategory } from '@/types/event'

function unwrap<T>(resp: unknown): T {
  const r = resp as { success?: boolean; data?: T }
  if (r?.success && r?.data != null) return r.data
  return resp as T
}

export interface BusinessEventStats {
  totalEvents: number
  upcomingEvents: number
  draftEvents: number
  totalRegistrations: number
  totalCheckIns: number
}

export type BusinessEventsTab = 'upcoming' | 'past' | 'drafts'

export interface CreateEventData {
  title: string
  description?: string
  category: EventCategory
  tags?: string[]
  imageUrl?: string | null
  highlights?: string[]
  whatsIncluded?: string[]
  whatToBring?: string[]
  specialInstructions?: string | null
  ageRestrictions?: string | null
  accessibilityInfo?: string | null
  startDate: string
  endDate: string
  timezone?: string
  venueName?: string | null
  address?: string | null
  latitude: number
  longitude: number
  isVirtual?: boolean
  virtualLink?: string | null
  requiresRegistration?: boolean
  maxAttendees?: number | null
  registrationDeadline?: string | null
  ticketPrice?: number | null
  featuredWaveLeaderId?: string | null
  waveLeaderRate?: number | null
  scheduledPublishAt?: string | null
  isFeatured?: boolean
  publishMode?: 'draft' | 'publish' | 'schedule'
}

export type UpdateEventData = Partial<CreateEventData>

export interface EventAttendeeRow {
  id: string
  eventId: string
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  registeredAt: string
  ticketsPurchased: number
  totalPaid: number | null
  status: string
  checkedIn: boolean
  checkedInAt: string | null
}

export const useBusinessEventStats = () => {
  return useQuery({
    queryKey: ['business', 'events', 'stats'],
    queryFn: async (): Promise<BusinessEventStats> => {
      const { data } = await api.get('/business/events/stats')
      return unwrap<BusinessEventStats>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useBusinessEvents = (tab: BusinessEventsTab = 'upcoming') => {
  return useQuery({
    queryKey: ['business', 'events', tab],
    queryFn: async (): Promise<Event[]> => {
      const { data } = await api.get('/business/events', { params: { tab } })
      const body = unwrap<{ items: Event[] }>(data)
      return body.items ?? []
    },
    retry: false,
    staleTime: 15 * 1000,
  })
}

export const useBusinessEvent = (eventId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['business', 'events', eventId],
    queryFn: async (): Promise<Event> => {
      const { data } = await api.get(`/business/events/${eventId}`)
      return unwrap<Event>(data)
    },
    enabled: Boolean(eventId) && enabled,
    retry: false,
  })
}

export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (eventData: CreateEventData): Promise<Event> => {
      const { data } = await api.post('/business/events', eventData)
      return unwrap<Event>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
      toast.success('Event saved successfully.')
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        'Failed to save event'
      toast.error(msg)
    },
  })
}

export const useUpdateEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateEventData
    }): Promise<Event> => {
      const { data } = await api.patch(`/business/events/${id}`, payload)
      return unwrap<Event>(data)
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['business', 'events', vars.id] })
      toast.success('Event updated.')
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        'Failed to update event'
      toast.error(msg)
    },
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/business/events/${id}`)
      return unwrap<{ deleted: boolean }>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
      toast.success('Draft deleted.')
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ||
        (e as Error)?.message ||
        'Could not delete event'
      toast.error(msg)
    },
  })
}

export const useCancelEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Event> => {
      const { data } = await api.post(`/business/events/${id}/cancel`)
      return unwrap<Event>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
      toast.success('Event cancelled.')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not cancel event')
    },
  })
}

export const useDuplicateEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Event> => {
      const { data } = await api.post(`/business/events/${id}/duplicate`)
      return unwrap<Event>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
      toast.success('Duplicate created as draft.')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not duplicate event')
    },
  })
}

export const useEventAttendees = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['events', eventId, 'attendees'],
    queryFn: async (): Promise<EventAttendeeRow[]> => {
      const { data } = await api.get(`/business/events/${eventId}/attendees`)
      const body = unwrap<{ items: EventAttendeeRow[] }>(data)
      return body.items ?? []
    },
    enabled: Boolean(eventId),
    retry: false,
    staleTime: 10 * 1000,
  })
}

export const useCheckInAttendee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      eventId,
      attendeeId,
      method,
    }: {
      eventId: string
      attendeeId: string
      method?: 'QR_CODE' | 'MANUAL'
    }) => {
      const { data } = await api.post(`/business/events/${eventId}/check-in`, {
        attendeeId,
        method,
      })
      return unwrap<{ checkedIn?: boolean; alreadyCheckedIn?: boolean; attendeeId: string }>(data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId, 'attendees'] })
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Check-in failed')
    },
  })
}

export const useCheckInScan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, scan }: { eventId: string; scan: string }) => {
      const { data } = await api.post(`/business/events/${eventId}/check-in/scan`, { scan })
      return unwrap<{ checkedIn?: boolean; alreadyCheckedIn?: boolean; attendeeId: string }>(data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId, 'attendees'] })
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Scan check-in failed')
    },
  })
}

export const useRemoveAttendee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, attendeeId }: { eventId: string; attendeeId: string }) => {
      const { data } = await api.delete(`/business/events/${eventId}/attendees/${attendeeId}`)
      return unwrap<{ removed: boolean }>(data)
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['events', v.eventId, 'attendees'] })
      queryClient.invalidateQueries({ queryKey: ['business', 'events'] })
      toast.success('Registration removed.')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not remove registration')
    },
  })
}
