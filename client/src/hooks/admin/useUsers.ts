import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminService,
  type UserFilters,
  type UpdateUserData,
} from '@/services/admin.service'

export const useUsers = (filters: UserFilters) => {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const { data } = await adminService.getUsers(filters)
      return data.data
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update user')
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete user')
    },
  })
}

export const useSuspendUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User suspended successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to suspend user')
    },
  })
}

export const useActivateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User activated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to activate user')
    },
  })
}

export const useBulkUserAction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action, userIds }: { action: string; userIds: string[] }) =>
      adminService.bulkAction(action, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(`${variables.userIds.length} users ${variables.action}ed successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Bulk action failed')
    },
  })
}
