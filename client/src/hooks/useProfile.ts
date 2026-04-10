import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userService, type ProfileData, type ProfileUpdateData } from '@/services/user.service'

export const useProfile = () => {
  return useQuery<ProfileData>({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      try {
        const { data } = await userService.getProfile()
        if (data.success && data.data) {
          return data.data
        }
        throw new Error('Failed to fetch profile')
      } catch (error) {
        // Return mock data for development
        return {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          bio: 'Adventure seeker and travel enthusiast',
          avatar: undefined,
          isVerified: true,
          createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          stats: {
            checkIns: 42,
            placesVisited: 18,
            reviewsWritten: 12,
            bookings: 5,
            pointsEarned: 2350,
            memberLevel: 3,
          },
          communities: [
            { id: '1', name: 'Beach Explorers', description: 'For beach lovers', joinedAt: new Date().toISOString() },
            { id: '2', name: 'Foodies United', description: 'Food enthusiasts', joinedAt: new Date().toISOString() },
          ],
          recentReviews: [
            {
              id: '1',
              businessId: '1',
              businessName: 'Ocean View Bar',
              rating: 5,
              comment: 'Amazing atmosphere and great drinks!',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const response = await userService.updateProfile(data)
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update profile')
      }
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile')
    },
  })
}

export const useUploadAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await userService.uploadAvatar(file)
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to upload avatar')
      }
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Avatar updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to upload avatar')
    },
  })
}
