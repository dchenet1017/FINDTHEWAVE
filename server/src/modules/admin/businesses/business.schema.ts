import { z } from 'zod'

export const getBusinessesQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  type: z.enum(['all', 'BAR', 'RESTAURANT', 'ENTERTAINMENT', 'FITNESS', 'WELLNESS', 'HOTEL', 'OTHER']).optional(),
  status: z.enum(['all', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const approveBusinessSchema = z.object({
  notes: z.string().optional(),
})

export const rejectBusinessSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  notes: z.string().optional(),
})


