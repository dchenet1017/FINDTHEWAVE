import { z } from 'zod'

const eventCategory = z.enum([
  'MUSIC',
  'SPORTS',
  'FOOD_DRINK',
  'WELLNESS',
  'NETWORKING',
  'EDUCATION',
  'ART',
  'NIGHTLIFE',
  'COMMUNITY',
  'OTHER',
])

export const createBusinessEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(50000).optional().default(''),
  category: eventCategory,
  tags: z.array(z.string()).optional().default([]),
  imageUrl: z.string().max(2000).optional().nullable(),
  highlights: z.array(z.string()).optional().default([]),
  whatsIncluded: z.array(z.string()).optional().default([]),
  whatToBring: z.array(z.string()).optional().default([]),
  specialInstructions: z.string().max(10000).optional().nullable(),
  ageRestrictions: z.string().max(500).optional().nullable(),
  accessibilityInfo: z.string().max(5000).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  timezone: z.string().optional().default('America/New_York'),
  venueName: z.string().max(300).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  isVirtual: z.boolean().optional().default(false),
  virtualLink: z.string().max(2000).optional().nullable(),
  requiresRegistration: z.boolean().optional().default(true),
  maxAttendees: z.number().int().positive().optional().nullable(),
  registrationDeadline: z.coerce.date().optional().nullable(),
  ticketPrice: z.number().nonnegative().optional().nullable(),
  featuredWaveLeaderId: z.string().optional().nullable(),
  waveLeaderRate: z.number().nonnegative().optional().nullable(),
  scheduledPublishAt: z.coerce.date().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  publishMode: z.enum(['draft', 'publish', 'schedule']).optional().default('draft'),
})

export const updateBusinessEventSchema = createBusinessEventSchema.partial()

export const listBusinessEventsQuerySchema = z
  .object({
    tab: z.enum(['upcoming', 'past', 'drafts']).optional(),
    status: z.enum(['upcoming', 'past', 'drafts']).optional(),
  })
  .transform((o) => ({ tab: o.tab ?? o.status }))

export const checkInBodySchema = z.object({
  attendeeId: z.string().min(1),
  method: z.enum(['QR_CODE', 'MANUAL']).optional(),
})

/** Accepts attendeeId or qrCode (raw id or JSON scan payload) */
export const businessCheckInBodySchema = z
  .object({
    attendeeId: z.string().optional(),
    qrCode: z.string().optional(),
    method: z.enum(['QR_CODE', 'MANUAL']).optional(),
  })
  .refine((d) => Boolean(d.attendeeId?.trim()) || Boolean(d.qrCode?.trim()), {
    message: 'attendeeId or qrCode is required',
  })

export const cancelEventBodySchema = z.object({
  reason: z.string().max(2000).optional(),
})

export const scanCheckInBodySchema = z.object({
  scan: z.string().min(1),
})
