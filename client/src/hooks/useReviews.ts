import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

export interface SubmitReviewData {
  bookingId: string
  rating: number
  review?: string
  tags?: string[]
  anonymous?: boolean
}

export interface ReviewsQueryParams {
  page?: number
  limit?: number
  sort?: 'recent'
}

export const useSubmitReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reviewData: SubmitReviewData) => {
      const { bookingId, ...payload } = reviewData
      const { data } = await api.post<{ success: boolean; data: unknown }>(
        `/bookings/${bookingId}/review`,
        payload
      )
      if (!data.success) {
        throw new Error((data as { error?: { message?: string } }).error?.message || 'Submit failed')
      }
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['waveleader'] })
      toast.success('Review submitted! Thank you for your feedback.')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export const useWaveLeaderReviews = (waveLeaderId: string, params?: ReviewsQueryParams) => {
  return useQuery({
    queryKey: ['waveleader', waveLeaderId, 'reviews', params],
    queryFn: async () => {
      const { data } = await api.get('/waveleaders/' + waveLeaderId + '/reviews', { params })
      return data
    },
    enabled: !!waveLeaderId,
  })
}

export const useReviewStats = (waveLeaderId: string) => {
  return useQuery({
    queryKey: ['waveleader', waveLeaderId, 'review-stats'],
    queryFn: async () => {
      const { data } = await api.get('/waveleaders/' + waveLeaderId + '/review-stats')
      return data
    },
    enabled: !!waveLeaderId,
  })
}

