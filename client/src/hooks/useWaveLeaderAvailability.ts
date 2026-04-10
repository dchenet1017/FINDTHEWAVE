import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface MonthAvailabilityResponse {
  month: string
  availableDates: string[] // YYYY-MM-DD
}

export interface Slot {
  time: string // HH:mm
  status: 'available' | 'booked'
}

export interface SlotsResponse {
  date: string // YYYY-MM-DD
  slots: Slot[]
}

export const useWaveLeaderAvailability = (waveLeaderId: string, month?: string) => {
  return useQuery({
    queryKey: ['waveleader', waveLeaderId, 'availability', month],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: MonthAvailabilityResponse }>(
        `/waveleader/${waveLeaderId}/availability`,
        { params: month ? { month } : undefined }
      )
      if (data.success) return data.data
      throw new Error('Failed to load availability')
    },
    enabled: !!waveLeaderId,
    staleTime: 60 * 1000,
  })
}

export const useTimeSlots = (waveLeaderId: string, date: string | undefined) => {
  return useQuery({
    queryKey: ['waveleader', waveLeaderId, 'slots', date],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: SlotsResponse }>(
        `/waveleader/${waveLeaderId}/slots`,
        { params: { date } }
      )
      if (data.success) return data.data
      throw new Error('Failed to load time slots')
    },
    enabled: !!waveLeaderId && !!date,
    staleTime: 30 * 1000,
  })
}

