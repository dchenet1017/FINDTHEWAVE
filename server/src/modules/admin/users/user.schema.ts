import { z } from 'zod'

export const getUsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  role: z.enum(['all', 'USER', 'WAVELEADER', 'BUSINESS', 'ADMIN']).optional(),
  status: z.enum(['all', 'active', 'inactive', 'unverified']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
})

export const changeRoleSchema = z.object({
  role: z.enum(['USER', 'WAVELEADER', 'BUSINESS', 'ADMIN']),
})

export const bulkActionSchema = z.object({
  action: z.enum(['activate', 'suspend', 'delete', 'verify']),
  userIds: z.array(z.string()).min(1),
})

