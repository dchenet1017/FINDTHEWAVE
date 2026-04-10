import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { checkInService, type CheckInResponse, type CanCheckInResponse } from '@/services/checkin.service'

export const useCheckIn = (businessId?: string, userLocation?: { lat: number; lng: number } | null) => {
  const queryClient = useQueryClient()

  // Check if user can check in
  const { data: canCheckInData, isLoading: checkingCanCheckIn } = useQuery<CanCheckInResponse>({
    queryKey: ['checkin', 'can-check-in', businessId],
    queryFn: async () => {
      if (!businessId) return { canCheckIn: false, reason: 'No business ID' }
      try {
        const { data } = await checkInService.canCheckIn(businessId, userLocation || undefined)
        if (data.success && data.data) {
          return data.data
        }
        return { canCheckIn: true } // Default to true if API not implemented
      } catch (error) {
        return { canCheckIn: true } // Default to true on error
      }
    },
    enabled: !!businessId,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await checkInService.checkIn(id, userLocation || undefined)
      if (!data.success) {
        throw new Error(data.error?.message || 'Check-in failed')
      }
      return data.data
    },
    onSuccess: (data: CheckInResponse | undefined) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', 'checkins'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'passport'] })
      queryClient.invalidateQueries({ queryKey: ['checkin', 'can-check-in'] })

      if (data) {
        toast.success(`Checked in! +${data.pointsEarned} points`)
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || error.message || 'Check-in failed'
      toast.error(message)
    },
  })

  return {
    checkIn: checkInMutation.mutate,
    isLoading: checkInMutation.isPending || checkingCanCheckIn,
    isSuccess: checkInMutation.isSuccess,
    data: checkInMutation.data,
    canCheckIn: canCheckInData?.canCheckIn ?? true,
    canCheckInReason: canCheckInData?.reason,
    lastCheckIn: canCheckInData?.lastCheckIn,
    distance: canCheckInData?.distance,
  }
}

