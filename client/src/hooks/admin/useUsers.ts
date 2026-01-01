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
      // TODO: Replace with actual API call
      // For now, return mock data
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Mock data generation
      const mockUsers = generateMockUsers()
      let filteredUsers = [...mockUsers]

      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filteredUsers = filteredUsers.filter(
          (u) =>
            u.email.toLowerCase().includes(search) ||
            u.firstName?.toLowerCase().includes(search) ||
            u.lastName?.toLowerCase().includes(search)
        )
      }

      if (filters.role && filters.role !== '') {
        filteredUsers = filteredUsers.filter((u) => u.role === filters.role)
      }

      if (filters.status) {
        if (filters.status === 'active') {
          filteredUsers = filteredUsers.filter((u) => u.isActive)
        } else if (filters.status === 'inactive') {
          filteredUsers = filteredUsers.filter((u) => !u.isActive)
        } else if (filters.status === 'unverified') {
          filteredUsers = filteredUsers.filter((u) => !u.isVerified)
        }
      }

      // Pagination
      const page = filters.page || 1
      const limit = filters.limit || 10
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedUsers = filteredUsers.slice(start, end)

      return {
        users: paginatedUsers,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
      }
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

// Mock data generator
function generateMockUsers() {
  const roles: Array<'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'> = [
    'USER',
    'WAVELEADER',
    'BUSINESS',
    'ADMIN',
  ]
  const firstNames = [
    'John',
    'Jane',
    'Mike',
    'Sarah',
    'David',
    'Emily',
    'Chris',
    'Lisa',
    'Tom',
    'Amy',
  ]
  const lastNames = [
    'Doe',
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Davis',
    'Miller',
    'Wilson',
    'Moore',
    'Taylor',
  ]

  const users = []
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
    const role = roles[Math.floor(Math.random() * roles.length)]
    const isActive = Math.random() > 0.2
    const isVerified = Math.random() > 0.1

    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365))

    const lastLogin = isActive && Math.random() > 0.3
      ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      : null

    users.push({
      id: `user-${i}`,
      email,
      firstName,
      lastName,
      avatar: null,
      role,
      isVerified,
      isActive,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      lastLogin: lastLogin?.toISOString() || null,
    })
  }

  return users
}

