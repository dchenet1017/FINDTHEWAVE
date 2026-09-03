import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  businessService,
  type PaginatedResponse,
  type MapBounds,
} from '@/services/business.service'
import type {
  Business,
  BusinessFilters,
  NearbyBusinessQuery,
  CreateBusinessInput,
  UpdateBusinessInput,
} from '../../../shared/types/business'

const handleError = (error: any, fallback: string) => {
  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  toast.error(message)
}

export const useBusinesses = (filters: BusinessFilters) =>
  useQuery<PaginatedResponse<Business>>({
    queryKey: ['businesses', filters],
    queryFn: async () => {
      const { data } = await businessService.getBusinesses(filters)
      const unwrapped = (data as any)?.data ?? data
      return unwrapped
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    onError: (error) => handleError(error, 'Failed to load businesses'),
  })

export const useBusiness = (id?: string) =>
  useQuery<Business>({
    queryKey: ['business', id],
    queryFn: async () => {
      const { data } = await businessService.getBusiness(id!)
      const unwrapped = (data as any)?.data ?? data
      return unwrapped
    },
    enabled: !!id,
    onError: (error) => handleError(error, 'Failed to load business'),
  })

export const useNearbyBusinesses = (query: NearbyBusinessQuery, enabled = true) =>
  useQuery<Business[]>({
    queryKey: ['businesses', 'nearby', query],
    queryFn: async () => {
      const { data } = await businessService.getNearbyBusinesses(query)
      const unwrapped = (data as any)?.data ?? data
      return Array.isArray(unwrapped) ? unwrapped : []
    },
    enabled,
    staleTime: 30 * 1000,
    onError: (error) => handleError(error, 'Failed to load nearby businesses'),
  })

export const useMapBusinesses = (bounds: MapBounds | null) =>
  useQuery<Business[]>({
    queryKey: ['businesses', 'map', bounds],
    queryFn: async () => {
      const { data } = await businessService.getBusinessesForMap(bounds!)
      const unwrapped = (data as any)?.data ?? data
      return Array.isArray(unwrapped) ? unwrapped : []
    },
    enabled: !!bounds,
    // Bounds change (a new object) on every map pan/zoom, so this query key
    // changes constantly. Without keeping the previous page's markers on
    // screen while the next bounds fetch is in flight, the list of
    // businesses would briefly go empty and the pins would flicker off and
    // back on with every map move.
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    onError: (error) => handleError(error, 'Failed to load map markers'),
  })

export const useSearchBusinesses = (
  searchTerm: string,
  location?: { lat: number; lng: number }
) =>
  useQuery<Business[]>({
    queryKey: ['businesses', 'search', searchTerm, location],
    queryFn: async () => {
      const { data } = await businessService.searchBusinesses(searchTerm, location)
      const unwrapped = (data as any)?.data ?? data
      return Array.isArray(unwrapped) ? unwrapped : []
    },
    enabled: Boolean(searchTerm?.length >= 2),
    staleTime: 15 * 1000,
    onError: (error) => handleError(error, 'Search failed'),
  })

export const useCreateBusiness = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBusinessInput) =>
      businessService.createBusiness(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      toast.success('Business created')
    },
    onError: (error) => handleError(error, 'Failed to create business'),
  })
}

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBusinessInput }) =>
      businessService.updateBusiness(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      toast.success('Business updated')
    },
    onError: (error) => handleError(error, 'Failed to update business'),
  })
}

export const useDeleteBusiness = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => businessService.deleteBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      toast.success('Business deleted')
    },
    onError: (error) => handleError(error, 'Failed to delete business'),
  })
}

export const useBusinessTypeCounts = () =>
  useQuery({
    queryKey: ['businesses', 'type-counts'],
    queryFn: async () => {
      const { data } = await businessService.getBusinessTypeCounts()
      const unwrapped = (data as any)?.data ?? data
      return Array.isArray(unwrapped) ? unwrapped : []
    },
    staleTime: 5 * 60 * 1000,
    onError: (error) => handleError(error, 'Failed to load type counts'),
  })

