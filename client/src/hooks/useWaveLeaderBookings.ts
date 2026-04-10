import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { BookingStatus } from '@/types/booking'
import type { WaveLeaderBookingClient } from '@/types/booking'

export interface WaveLeaderBookingsStats {
  thisWeekBookings: number
  thisWeekRevenue: number
  pendingCount: number
  averageRating: number
  totalReviews: number
}

export const useWaveLeaderBookings = (status?: BookingStatus) => {
  return useQuery({
    queryKey: ['waveleader', 'bookings', status],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: WaveLeaderBookingClient[] }>(
        '/waveleader/bookings',
        { params: status ? { status } : undefined }
      )
      if (!data.success || !data.data) throw new Error('Failed to load bookings')
      return data.data
    },
  })
}

export const useWaveLeaderBookingsStats = () => {
  return useQuery({
    queryKey: ['waveleader', 'bookings', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: WaveLeaderBookingsStats }>(
        '/waveleader/bookings/stats'
      )
      if (!data.success || !data.data) throw new Error('Failed to load stats')
      return data.data
    },
  })
}

export const useAcceptBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<{ success: boolean; data: { id: string; status: string } }>(
        `/bookings/${bookingId}/accept`
      )
      if (!data.success || !data.data) throw new Error((data as { error?: { message?: string } }).error?.message || 'Accept failed')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'bookings', 'stats'] })
      toast.success('Booking accepted!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export interface DeclineData {
  bookingId: string
  reason: string
  message?: string
}

export const useDeclineBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, reason, message }: DeclineData) => {
      const { data } = await api.post<{ success: boolean; data: unknown }>(
        `/bookings/${bookingId}/decline`,
        { reason, message }
      )
      if (!data.success) throw new Error((data as { error?: { message?: string } }).error?.message || 'Decline failed')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'bookings', 'stats'] })
      toast.success('Booking declined')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export interface ProposeData {
  bookingId: string
  newDate: string
  newTime: string
  message?: string
}

export const useProposeNewTime = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, newDate, newTime, message }: ProposeData) => {
      const { data } = await api.post<{ success: boolean; data: unknown }>(
        `/bookings/${bookingId}/propose`,
        { newDate, newTime, message }
      )
      if (!data.success) throw new Error((data as { error?: { message?: string } }).error?.message || 'Propose failed')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'bookings'] })
      toast.success('New time proposed to client')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export const useStartSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<{ success: boolean; data: { id: string; status: string } }>(
        `/bookings/${bookingId}/start`
      )
      if (!data.success || !data.data) throw new Error((data as { error?: { message?: string } }).error?.message || 'Start failed')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'bookings'] })
      toast.success('Session started!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export const useEndSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<{ success: boolean; data: { id: string; status: string } }>(
        `/bookings/${bookingId}/end`
      )
      if (!data.success || !data.data) throw new Error((data as { error?: { message?: string } }).error?.message || 'End failed')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'bookings'] })
      toast.success('Session completed!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
