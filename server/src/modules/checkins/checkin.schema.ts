import { z } from 'zod'

export const checkInBodySchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const canCheckInQuerySchema = z.object({
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
})

