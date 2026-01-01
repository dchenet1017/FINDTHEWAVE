import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminService,
  type BusinessFilters,
} from '@/services/admin.service'

export const useBusinesses = (filters: BusinessFilters) => {
  return useQuery({
    queryKey: ['admin', 'businesses', filters],
    queryFn: async () => {
      const { data } = await adminService.getBusinesses(filters)
      return data
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useBusiness = (id: string) => {
  return useQuery({
    queryKey: ['admin', 'businesses', id],
    queryFn: async () => {
      const { data } = await adminService.getBusiness(id)
      return data
    },
    enabled: !!id,
  })
}

export const useApproveBusiness = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminService.approveBusiness(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Business approved successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to approve business')
    },
  })
}

export const useRejectBusiness = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
      adminService.rejectBusiness(id, reason, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Business rejected')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to reject business')
    },
  })
}

export const useDeleteBusiness = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminService.deleteBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      toast.success('Business deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete business')
    },
  })
}


