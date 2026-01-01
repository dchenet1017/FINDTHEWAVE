import { z } from 'zod'

export const createBusinessSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  type: z.enum(['BAR', 'RESTAURANT', 'ENTERTAINMENT', 'FITNESS', 'WELLNESS', 'HOTEL', 'OTHER']),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(3),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional().default([]),
})

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
})

export const createPromotionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  discount: z.string().min(1).default('0%'),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional().default(true),
})

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().optional().default(5), // miles
  types: z.string().optional(), // comma-separated
  limit: z.coerce.number().optional().default(50),
})

export const mapBoundsSchema = z.object({
  north: z.coerce.number(),
  south: z.coerce.number(),
  east: z.coerce.number(),
  west: z.coerce.number(),
})

