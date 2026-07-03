import { z } from 'zod'

export const createBusinessCrawlSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(50000).optional().default(''),
  imageUrl: z.string().max(2000).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxAttendees: z.number().int().positive().optional().nullable(),
  bonusPoints: z.number().int().nonnegative().optional().default(50),
  stopBusinessIds: z.array(z.string().min(1)).min(2, 'A crawl needs at least 2 stops'),
  publishMode: z.enum(['draft', 'publish']).optional().default('draft'),
})

export const updateBusinessCrawlSchema = createBusinessCrawlSchema.partial().extend({
  stopBusinessIds: z.array(z.string().min(1)).min(2).optional(),
})

export const businessCrawlCheckInBodySchema = z
  .object({
    attendeeId: z.string().optional(),
    qrCode: z.string().optional(),
    method: z.enum(['QR_CODE', 'MANUAL']).optional(),
  })
  .refine((d) => Boolean(d.attendeeId?.trim()) || Boolean(d.qrCode?.trim()), {
    message: 'attendeeId or qrCode is required',
  })
