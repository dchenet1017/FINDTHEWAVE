import { z } from 'zod'

/** Vibe tags offered in the "I want to go out" sheet. Mirrored in client/src/types/goOut.ts */
export const VIBES = [
  'ROOFTOP',
  'DRINKS',
  'LIVE_MUSIC',
  'DANCING',
  'FOOD',
  'COMEDY',
  'CHILL',
  'WHATEVER',
] as const

export type Vibe = (typeof VIBES)[number]

/** An intent lives for two hours unless the user lowers their hand sooner. */
export const DEFAULT_INTENT_MINUTES = 120
export const MAX_PARTY_SIZE = 5
export const DEFAULT_OFFER_MINUTES = 90

export const raiseHandSchema = z
  .object({
    vibes: z.array(z.enum(VIBES)).min(1).max(VIBES.length),
    partySize: z.number().int().min(1).max(MAX_PARTY_SIZE).default(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    /** Optional override; clamped server-side */
    durationMinutes: z.number().int().min(15).max(480).optional(),
  })
  .strict()

export const activeDemandQuerySchema = z
  .object({
    radius: z.coerce.number().min(0.5).max(50).default(10),
    /** Admins have no business location on file and must pass a point */
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  .strict()

export const sendOfferSchema = z
  .object({
    message: z.string().trim().min(1).max(500),
    perkDescription: z.string().trim().min(1).max(200),
    doorCode: z.string().trim().max(40).optional().nullable(),
    radiusMiles: z.number().min(0.5).max(50).default(5),
    /** Only reach intents that asked for at least one of these */
    vibes: z.array(z.enum(VIBES)).optional(),
    expiresInMinutes: z.number().int().min(15).max(480).optional(),
    /**
     * Post one open offer any nearby user can claim, instead of fanning out
     * one targeted offer per matching intent.
     */
    broadcast: z.boolean().default(false),
  })
  .strict()

export const respondOfferParamsSchema = z.object({
  offerId: z.string().min(1),
})

export const respondOfferSchema = z
  .object({
    action: z.enum(['ACCEPT', 'DECLINE']),
  })
  .strict()

/**
 * Written out rather than inferred with z.infer: this package compiles with
 * `strict: false`, under which zod widens every field to optional and the
 * post-validation shape stops matching what the services actually receive.
 * These mirror the schemas above - keep them in step.
 */

export interface RaiseHandInput {
  vibes: Vibe[]
  partySize: number
  latitude: number
  longitude: number
  durationMinutes?: number
}

export interface ActiveDemandQuery {
  radius: number
  lat?: number
  lng?: number
}

export interface SendOfferInput {
  message: string
  perkDescription: string
  doorCode?: string | null
  radiusMiles: number
  vibes?: Vibe[]
  expiresInMinutes?: number
  broadcast: boolean
}

export interface RespondOfferInput {
  action: 'ACCEPT' | 'DECLINE'
}
