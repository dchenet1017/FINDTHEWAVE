export type AdStatus = 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'DRAFT'

export type AdType =
  | 'STANDARD_PROMOTION'
  | 'EVENT_ANNOUNCEMENT'
  | 'NEW_MENU_ITEM'
  | 'SPECIAL_OFFER'

export interface Advertisement {
  id: string
  title: string
  description: string
  type: AdType
  status: AdStatus
  ctaText: string
  imageUrl?: string | null

  // Targeting
  radiusMiles: number
  demographicsEnabled?: boolean
  peakHoursEnabled?: boolean
  weekendBoostEnabled?: boolean

  // Schedule
  startDate: string // YYYY-MM-DD
  endDate?: string | null // YYYY-MM-DD or null for continuous

  // Pricing/metrics
  dailyBudget: number
  totalSpent: number
  impressions: number
  clicks: number

  createdAt: string
  updatedAt: string
}

export interface CreateAdData {
  title: string
  description: string
  type: AdType
  ctaText: string
  imageUrl?: string | null

  radiusMiles: number
  demographicsEnabled: boolean
  peakHoursEnabled: boolean
  weekendBoostEnabled: boolean

  startDate: string
  endDate?: string | null
  runContinuously?: boolean

  dailyBudget: number
}

