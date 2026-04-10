export type EventCategory =
  | 'MUSIC'
  | 'SPORTS'
  | 'FOOD_DRINK'
  | 'WELLNESS'
  | 'NETWORKING'
  | 'EDUCATION'
  | 'ART'
  | 'NIGHTLIFE'
  | 'COMMUNITY'
  | 'OTHER'

export interface EventBusinessSummary {
  id: string
  name: string
  city?: string | null
  address?: string | null
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  website?: string | null
  /** First business image (for tickets / widgets) */
  imageUrl?: string | null
}

export interface EventWaveLeaderSummary {
  id: string
  displayName: string
  specialty: string
}

export interface EventWaveLeaderDetail extends EventWaveLeaderSummary {
  description?: string
  hourlyRate?: number | null
  rating?: number
  totalReviews?: number
  totalBookings?: number
  isVerified?: boolean
  portfolioImages?: string[]
  tags?: string[]
  user?: {
    firstName?: string | null
    lastName?: string | null
    avatar?: string | null
  }
}

export interface Event {
  id: string
  businessId: string
  title: string
  description: string
  imageUrl: string | null
  category: EventCategory
  tags: string[]
  highlights?: string[]
  whatsIncluded?: string[]
  whatToBring?: string[]
  venueName: string | null
  address: string | null
  latitude: number
  longitude: number
  isVirtual: boolean
  virtualLink: string | null
  startDate: string
  endDate: string
  timezone: string
  requiresRegistration: boolean
  maxAttendees: number | null
  currentAttendees: number
  registrationDeadline: string | null
  ticketPrice: number | null
  featuredWaveLeaderId: string | null
  waveLeaderRate: number | null
  status: string
  isPublished: boolean
  isFeatured: boolean
  views: number
  registrations: number
  checkIns: number
  specialInstructions?: string | null
  ageRestrictions?: string | null
  accessibilityInfo?: string | null
  scheduledPublishAt?: string | null
  business?: EventBusinessSummary
  featuredWaveLeader?: EventWaveLeaderSummary | EventWaveLeaderDetail | null
  distanceMiles?: number
}

export interface MyEventRegistration {
  id: string
  eventId: string
  userId: string
  registeredAt: string
  status: string
  ticketsPurchased: number
  totalPaid: number | null
  paymentIntentId: string | null
  checkedIn: boolean
  checkedInAt: string | null
  qrPayload: string
}

/** Row from GET /users/me/events */
export interface MyRegisteredEvent extends MyEventRegistration {
  event: Event
}

export interface EventsListResponse {
  items: Event[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type EventSortOption = 'soon' | 'popular' | 'nearest' | 'recent'

export type EventDatePreset =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'this_weekend'
  | 'next_week'
  | 'custom'

export interface EventDiscoveryFilters {
  search: string
  category: EventCategory | 'ALL'
  datePreset: EventDatePreset
  dateFrom: string | undefined
  dateTo: string | undefined
  freeOnly: boolean
  hasWaveLeader: boolean
  virtualOnly: boolean
  minPrice: number
  maxPrice: number
  distanceMiles: number
  minSpotsLeft: number
  sort: EventSortOption
  page: number
  limit: number
}

export const defaultEventDiscoveryFilters = (): EventDiscoveryFilters => ({
  search: '',
  category: 'ALL',
  datePreset: 'all',
  dateFrom: undefined,
  dateTo: undefined,
  freeOnly: false,
  hasWaveLeader: false,
  virtualOnly: false,
  minPrice: 0,
  maxPrice: 500,
  distanceMiles: 25,
  minSpotsLeft: 0,
  sort: 'soon',
  page: 1,
  limit: 24,
})
