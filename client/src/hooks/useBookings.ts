import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { CreateBookingPayload, CreateBookingResponse } from '@/types/booking-payment'
import type { BookingDetail, UserBooking } from '@/types/booking'

export const useCreateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingData: CreateBookingPayload) => {
      const { data } = await api.post<{ success: boolean; data: CreateBookingResponse }>(
        '/bookings',
        bookingData
      )
      if (!data.success || !data.data) {
        throw new Error((data as { error?: { message?: string } }).error?.message || 'Failed to create booking')
      }
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'bookings'] })
    },
  })
}

export const useConfirmBookingPayment = () => {
  return useMutation({
    mutationFn: async ({
      bookingId,
      paymentIntentId,
    }: {
      bookingId: string
      paymentIntentId: string
    }) => {
      const { data } = await api.post<{ success: boolean; data: { id: string; status: string } }>(
        `/bookings/${bookingId}/confirm-payment`,
        { paymentIntentId }
      )
      if (!data.success || !data.data) {
        throw new Error((data as { error?: { message?: string } }).error?.message || 'Confirmation failed')
      }
      return data.data
    },
  })
}

export type BookingsTab = 'upcoming' | 'past' | 'cancelled'

export const useUserBookings = (
  status: BookingsTab,
  sort?: string,
  search?: string
) => {
  return useQuery({
    queryKey: ['user', 'bookings', status, sort, search],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: UserBooking[] }>('/users/me/bookings', {
        params: { status, sort, search: search || undefined },
      })
      if (!data.success || !data.data) {
        throw new Error('Failed to load bookings')
      }
      return data.data
    },
  })
}

export const useBookingDetails = (bookingId: string | null) => {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: BookingDetail }>(
        `/bookings/${bookingId}`
      )
      if (!data.success || !data.data) {
        throw new Error('Failed to load booking')
      }
      return data.data
    },
    enabled: !!bookingId,
  })
}

export const useCancelBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const { data } = await api.post<{ success: boolean; data: unknown }>(
        `/bookings/${bookingId}/cancel`,
        { reason }
      )
      if (!data.success) {
        throw new Error((data as { error?: { message?: string } }).error?.message || 'Cancel failed')
      }
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking'] })
      toast.success('Booking cancelled')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export interface RescheduleData {
  bookingId: string
  newDate: string
  newTime: string
}

export const useRescheduleBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, newDate, newTime }: RescheduleData) => {
      const { data } = await api.post<{ success: boolean; data: BookingDetail }>(
        `/bookings/${bookingId}/reschedule`,
        { newDate, newTime }
      )
      if (!data.success || !data.data) {
        throw new Error((data as { error?: { message?: string } }).error?.message || 'Reschedule failed')
      }
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking'] })
      toast.success('Booking rescheduled')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
