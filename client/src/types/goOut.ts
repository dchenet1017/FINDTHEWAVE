/** Mirrors server/src/modules/go-out/go-out.schema.ts */
export type Vibe =
  | 'ROOFTOP'
  | 'DRINKS'
  | 'LIVE_MUSIC'
  | 'DANCING'
  | 'FOOD'
  | 'COMEDY'
  | 'CHILL'
  | 'WHATEVER'

export type IntentStatus = 'ACTIVE' | 'EXPIRED' | 'CLAIMED'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

export interface GoOutIntent {
  id: string
  status: IntentStatus
  vibes: Vibe[]
  partySize: number
  latitude: number
  longitude: number
  createdAt: string
  expiresAt: string
}

export interface OfferBusiness {
  id: string
  name: string
  type: string
  address: string | null
  latitude: number | null
  longitude: number | null
}

export interface BusinessOffer {
  id: string
  intentId: string | null
  message: string
  perkDescription: string
  /** Only returned once the offer has been accepted */
  doorCode: string | null
  status: OfferStatus
  createdAt: string
  expiresAt: string
  respondedAt: string | null
  business: OfferBusiness | null
}

export interface MyIntentResponse {
  intent: GoOutIntent | null
  /** Other hands up within 10 miles. An aggregate - never who. */
  nearbyCount: number
}

export interface MyOffersResponse {
  intentId: string | null
  offers: BusinessOffer[]
}

export interface ActiveDemand {
  radiusMiles: number
  totalIntents: number
  totalPeople: number
  byVibe: { vibe: Vibe; count: number }[]
  byPartySize: { partySize: number; label: string; count: number }[]
  byDistance: { label: string; count: number }[]
}

export interface SendOfferResult {
  broadcast: boolean
  offersCreated: number
  matchedIntents: number
  offer: BusinessOffer | null
}

export interface RaiseHandInput {
  vibes: Vibe[]
  partySize: number
  latitude: number
  longitude: number
  durationMinutes?: number
}

export interface SendOfferInput {
  message: string
  perkDescription: string
  doorCode?: string | null
  radiusMiles: number
  vibes?: Vibe[]
  expiresInMinutes?: number
  broadcast?: boolean
}

export const VIBE_OPTIONS: { value: Vibe; label: string; emoji: string }[] = [
  { value: 'ROOFTOP', label: 'Rooftop', emoji: '🌇' },
  { value: 'DRINKS', label: 'Drinks', emoji: '🍸' },
  { value: 'LIVE_MUSIC', label: 'Live Music', emoji: '🎸' },
  { value: 'DANCING', label: 'Dancing', emoji: '💃' },
  { value: 'FOOD', label: 'Food', emoji: '🍜' },
  { value: 'COMEDY', label: 'Comedy', emoji: '🎤' },
  { value: 'CHILL', label: 'Chill', emoji: '🛋️' },
  { value: 'WHATEVER', label: 'Whatever', emoji: '✨' },
]

export const PARTY_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Just me' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5+' },
]

const VIBE_LABELS = new Map(VIBE_OPTIONS.map((v) => [v.value, v.label]))
const VIBE_EMOJI = new Map(VIBE_OPTIONS.map((v) => [v.value, v.emoji]))

export const vibeLabel = (vibe: Vibe | string) => VIBE_LABELS.get(vibe as Vibe) ?? vibe
export const vibeEmoji = (vibe: Vibe | string) => VIBE_EMOJI.get(vibe as Vibe) ?? '✨'

export const partySizeLabel = (size: number) =>
  size === 1 ? 'Just me' : size >= 5 ? '5+' : String(size)

/** e.g. "1h 24m left", or "Expired" once the window closes */
export function timeLeftLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}
