import api from '@/lib/axios'
import type {
  Business,
  BusinessFilters,
  BusinessType,
  ApprovalStatus,
  NearbyBusinessQuery,
  CreateBusinessInput,
  UpdateBusinessInput,
} from '../../../shared/types/business'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MapBounds {
  ne: { lat: number; lng: number }
  sw: { lat: number; lng: number }
}

export interface BusinessTypeCounts {
  type: BusinessType | ApprovalStatus | string
  count: number
}

export const businessService = {
  getBusinesses: (filters: BusinessFilters) =>
    api.get<PaginatedResponse<Business>>('/businesses', { params: filters }),

  getBusiness: (id: string) => api.get<Business>(`/businesses/${id}`),

  getNearbyBusinesses: (query: NearbyBusinessQuery) =>
    api.get<Business[]>('/businesses/nearby', { params: query }),

  searchBusinesses: (searchTerm: string, location?: { lat: number; lng: number }) =>
    api.get<Business[]>('/businesses/search', {
      params: { q: searchTerm, ...location },
    }),

  createBusiness: (input: CreateBusinessInput) =>
    api.post<Business>('/businesses', input),

  updateBusiness: (id: string, input: UpdateBusinessInput) =>
    api.patch<Business>(`/businesses/${id}`, input),

  deleteBusiness: (id: string) => api.delete(`/businesses/${id}`),

  getBusinessesForMap: (bounds: MapBounds) =>
    api.get<Business[]>('/businesses/map', {
      params: {
        north: bounds.ne.lat,
        south: bounds.sw.lat,
        east: bounds.ne.lng,
        west: bounds.sw.lng,
      },
    }),

  getBusinessTypeCounts: () =>
    api.get<BusinessTypeCounts[]>('/businesses/type-counts'),
}

