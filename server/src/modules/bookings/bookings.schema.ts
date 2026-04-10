import { z } from 'zod'

export const createBookingSchema = z.object({
  waveLeaderId: z.string().min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.number().min(1).max(4),
  serviceType: z.string().min(1).max(200),
  location: z.string().min(1).max(500),
  notes: z.string().max(2000).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
})

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const rescheduleBookingSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export const declineBookingSchema = z.object({
  reason: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
})

export const proposeBookingSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().max(1000).optional(),
})

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
  tags: z.array(z.string().min(1).max(40)).max(8).optional(),
  anonymous: z.boolean().optional(),
})
