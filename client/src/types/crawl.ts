export interface CrawlBusinessSummary {
  id: string
  name: string
  type?: string
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  images?: string[]
}

export interface CrawlStop {
  id: string
  crawlId: string
  businessId: string
  order: number
  business: CrawlBusinessSummary | null
}

export interface Crawl {
  id: string
  hostBusinessId: string | null
  createdByUserId: string | null
  title: string
  description: string
  imageUrl: string | null
  startDate: string
  endDate: string
  status: string
  isPublished: boolean
  maxAttendees: number | null
  currentAttendees: number
  bonusPoints: number
  stops: CrawlStop[]
  hostBusiness?: { id: string; name: string; city?: string; address?: string; type?: string } | null
  createdByUser?: { id: string; firstName: string | null; lastName: string | null } | null
  distanceMiles?: number
  _count?: { attendees: number }
}

export interface MyCrawlRegistration {
  id: string
  crawlId: string
  userId: string
  registeredAt: string
  status: string
  completedAt: string | null
  bonusAwarded: boolean
  qrPayload: string
}

export interface CrawlsListResponse {
  items: Crawl[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type CrawlSortOption = 'soon' | 'popular' | 'recent'

export interface CrawlDiscoveryFilters {
  search: string
  sort: CrawlSortOption
  page: number
  limit: number
}

export const defaultCrawlDiscoveryFilters = (): CrawlDiscoveryFilters => ({
  search: '',
  sort: 'soon',
  page: 1,
  limit: 24,
})
