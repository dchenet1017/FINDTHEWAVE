import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import api from '@/lib/axios'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** The signed-in owner's own venue, as /businesses/my/business returns it */
export interface MyBusiness {
  id: string
  name: string
  type: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: string | number
  longitude: string | number
  phone: string | null
  website: string | null
  approvalStatus: ApprovalStatus
  isActive: boolean
  isVerified: boolean
}

export interface CreateBusinessInput {
  name: string
  description: string
  type: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  phone?: string | null
  website?: string | null
}

export const myBusinessKey = ['business', 'mine'] as const

/**
 * The owner's venue, or null when the account has not set one up yet - a
 * brand-new business sign-up, which onboarding then walks through creating.
 */
export const useMyBusiness = (enabled = true) =>
  useQuery<MyBusiness | null>({
    queryKey: myBusinessKey,
    queryFn: async () => {
      try {
        const { data } = await api.get<{ success: boolean; data: MyBusiness }>(
          '/businesses/my/business'
        )
        return data.data ?? null
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null
        throw error
      }
    },
    enabled,
    staleTime: 60_000,
  })

export const useCreateBusiness = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBusinessInput) => {
      const { data } = await api.post<{ success: boolean; data: MyBusiness }>(
        '/businesses',
        input
      )
      return data.data
    },
    onSuccess: (business) => {
      queryClient.setQueryData(myBusinessKey, business)
    },
    onError: (error) => {
      const body = isAxiosError(error) ? error.response?.data?.error : undefined
      const detail = body?.details?.[0]
      const message = detail ? `${detail.path}: ${detail.message}` : body?.message
      toast.error(message || 'Could not save your venue. Please try again.')
    },
  })
}
