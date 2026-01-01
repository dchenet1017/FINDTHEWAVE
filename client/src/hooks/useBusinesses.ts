import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
      return data
    },
    keepPreviousData: true,
    staleTime: 30 * 1000,
    onError: (error) => handleError(error, 'Failed to load businesses'),
  })

export const useBusiness = (id?: string) =>
  useQuery<Business>({
    queryKey: ['business', id],
    queryFn: async () => {
      const { data } = await businessService.getBusiness(id!)
      return data
    },
    enabled: !!id,
    onError: (error) => handleError(error, 'Failed to load business'),
  })

export const useNearbyBusinesses = (query: NearbyBusinessQuery, enabled = true) =>
  useQuery<Business[]>({
    queryKey: ['businesses', 'nearby', query],
    queryFn: async () => {
      const { data } = await businessService.getNearbyBusinesses(query)
      return data
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
      return data
    },
    enabled: !!bounds,
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
      return data
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
      return data
    },
    staleTime: 5 * 60 * 1000,
    onError: (error) => handleError(error, 'Failed to load type counts'),
  })

