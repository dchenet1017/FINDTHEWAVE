import { z } from 'zod'

/** Vibes offered in step 2. Kept in sync with client/src/types/onboarding.ts */
export const INTERESTS = [
  'LIVE_MUSIC',
  'DANCING',
  'COMEDY',
  'CHILL',
  'FOOD',
  'MORE',
] as const

export const experienceGoalSchema = z.enum([
  'GO_OUT',
  'EXPLORE_PLACES',
  'PLAN_AHEAD',
])

/**
 * Every field is optional: the wizard PATCHes a partial after each step so a
 * user who drops out mid-flow keeps whatever they already answered.
 */
export const updateOnboardingSchema = z
  .object({
    step: z.number().int().min(1).max(6).optional(),

    // Step 2 - Tell us about you
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().max(50).optional().nullable(),
    interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length).optional(),
    locationLat: z.number().min(-90).max(90).optional().nullable(),
    locationLng: z.number().min(-180).max(180).optional().nullable(),
    locationLabel: z.string().trim().max(200).optional().nullable(),

    // Step 3 - Choose your experience
    experienceGoal: experienceGoalSchema.optional(),

    // Step 4 - Set your preferences
    nightVibe: z.number().int().min(0).max(100).optional(),
    maxDistanceMiles: z.number().int().min(1).max(15).optional(),
    notificationsEnabled: z.boolean().optional(),

    // Step 5 - Join the wave
    locationSharingEnabled: z.boolean().optional(),
  })
  .strict()

export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>
