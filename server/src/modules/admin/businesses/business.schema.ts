import { z } from 'zod'

/** The admin tables send an empty string for an unset filter; treat it as no filter. */
const optionalFilter = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.enum(values).optional())

export const getBusinessesQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  type: optionalFilter(['all', 'BAR', 'RESTAURANT', 'ENTERTAINMENT', 'FITNESS', 'WELLNESS', 'HOTEL', 'OTHER']),
  status: optionalFilter(['all', 'PENDING', 'APPROVED', 'REJECTED']),
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


