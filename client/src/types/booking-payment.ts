/** Draft carried from book page → payment (location.state) */
export interface BookingPaymentDraft {
  waveLeaderId: string
  scheduledDate: string
  scheduledTime: string
  durationHours: number
  serviceType: string
  location: string
  notes?: string
  waveLeaderName: string
  waveLeaderAvatar?: string
  hourlyRate: number
}

/** Payload for POST /bookings */
export interface CreateBookingPayload {
  waveLeaderId: string
  scheduledDate: string
  scheduledTime: string
  durationHours: number
  serviceType: string
  location: string
  notes?: string
}

export interface CreateBookingResponse {
  id: string
  clientSecret: string
}
