import api from '@/lib/axios'

export interface CheckInResponse {
  checkIn: {
    id: string
    businessId: string
    method: 'MANUAL' | 'QR_CODE' | 'GEOFENCE'
    points: number
    createdAt: string
  }
  pointsEarned: number
  totalPoints: number
  streak?: number
  message?: string
}

export interface CanCheckInResponse {
  canCheckIn: boolean
  reason?: string
  lastCheckIn?: string
  distance?: number
}

export const checkInService = {
  checkIn: (businessId: string, location?: { lat: number; lng: number }) =>
    api.post<{
      success: boolean
      data?: CheckInResponse
      error?: {
        code: string
        message: string
      }
    }>(`/checkins/${businessId}`, {
      latitude: location?.lat,
      longitude: location?.lng,
    }),

  canCheckIn: (businessId: string, location?: { lat: number; lng: number }) =>
    api.get<{
      success: boolean
      data?: CanCheckInResponse
    }>(`/checkins/can-check-in/${businessId}`, {
      params: {
        latitude: location?.lat,
        longitude: location?.lng,
      },
    }),
}

