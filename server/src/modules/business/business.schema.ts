import { z } from 'zod'

const validDateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date',
})

const normalizedBool = z.preprocess((value) => {
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return value
}, z.boolean())

const jsonValue = z.any().optional()

export const revenueQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
})

export const analyticsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom', '7d', '30d', '90d', '1y']).default('30d'),
  compareTo: z.enum(['previous', 'none']).optional(),
  startDate: validDateString.optional(),
  endDate: validDateString.optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional(),
})

export const periodQuerySchema = z.object({
  period: z.string().default('30d'),
})

export const limitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
})

export const updateLocationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().min(1),
})

export const competitorsQuerySchema = z.object({
  radius: z.coerce.number().min(1).max(50).default(5),
})

export const waveleadersQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(50).default(25),
})

const adDateSchema = validDateString

const advertisementSchemaBase = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  imageUrl: z.string().url().nullable().optional(),
  ctaText: z.string().max(30).default('Learn More'),
  targetRadius: z.coerce.number().min(1).max(25).optional(),
  radiusMiles: z.coerce.number().min(1).max(25).optional(),
  targetDemographics: jsonValue,
  demographicsEnabled: normalizedBool.optional(),
  peakHoursOnly: normalizedBool.optional(),
  peakHoursEnabled: normalizedBool.optional(),
  specificHours: jsonValue,
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  startDate: adDateSchema,
  endDate: adDateSchema.nullable().optional(),
  weekendBoost: normalizedBool.optional(),
  weekendBoostEnabled: normalizedBool.optional(),
  type: z.string().optional(),
  runContinuously: normalizedBool.optional(),
  dailyBudget: z.coerce.number().min(50).max(500).optional(),
})

export const createAdvertisementSchema = advertisementSchemaBase
  .refine((data) => data.targetRadius != null || data.radiusMiles != null, {
    message: 'A target radius is required',
    path: ['targetRadius'],
  })
  .refine((data) => data.runContinuously || data.endDate, {
    message: 'End date is required unless running continuously',
    path: ['endDate'],
  })
  .refine((data) => {
    if (!data.endDate || data.runContinuously) return true
    return new Date(data.endDate) > new Date(data.startDate)
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export const updateAdvertisementSchema = advertisementSchemaBase.partial()

export const adEstimateQuerySchema = z.object({
  radius: z.coerce.number().min(1).max(25),
  demographics: jsonValue,
})

export const advertisementIdParamsSchema = z.object({
  id: z.string().min(1),
})
