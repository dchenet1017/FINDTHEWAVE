import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
})

export const updateSettingsSchema = z.object({
  privacy: z
    .object({
      profileVisibility: z.enum(['public', 'private']).optional(),
      showCheckInHistory: z.boolean().optional(),
      allowLocationTracking: z.boolean().optional(),
    })
    .optional(),
  notifications: z
    .object({
      email: z
        .object({
          bookingConfirmations: z.boolean().optional(),
          bookingReminders: z.boolean().optional(),
          promotionalOffers: z.boolean().optional(),
          weeklyDigest: z.boolean().optional(),
        })
        .optional(),
      push: z
        .object({
          nearbyDeals: z.boolean().optional(),
          checkInReminders: z.boolean().optional(),
          newWaveLeaders: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  preferences: z
    .object({
      defaultMapView: z.enum(['map', 'satellite', 'hybrid']).optional(),
      distanceUnit: z.enum(['miles', 'kilometers']).optional(),
      theme: z.enum(['dark', 'light', 'system']).optional(),
      language: z.string().optional(),
    })
    .optional(),
})

