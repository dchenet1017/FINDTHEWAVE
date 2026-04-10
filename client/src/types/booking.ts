export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DECLINED'

export interface BookingWaveLeader {
  id: string
  displayName: string
  specialty: string
  rating: number
  totalReviews: number
  avatar: string | null
  location?: string | null
}

/** List item from GET /users/me/bookings */
export interface UserBooking {
  id: string
  reference: string
  waveLeaderId: string
  waveLeader: BookingWaveLeader | null
  scheduledDate: string
  scheduledTime: string
  duration: number
  serviceType: string | null
  location: string
  totalAmount: number
  serviceFee: number
  status: BookingStatus
  notes: string | null
  rating: number | null
  review: string | null
  cancelReason: string | null
  createdAt: string
}

/** GET /bookings/:id */
export interface BookingDetail extends UserBooking {
  userEmail: string
  paymentIntentId: string | null
}

/** List item from GET /waveleader/bookings (WaveLeader view) */
export interface WaveLeaderBookingClient {
  id: string
  userId: string
  reference: string
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    avatar: string | null
    displayName: string
  } | null
  scheduledDate: string
  scheduledTime: string
  duration: number
  serviceType: string | null
  location: string
  notes: string | null
  totalAmount: number
  serviceFee: number
  status: BookingStatus
  cancelReason: string | null
  rating: number | null
  review: string | null
  createdAt: string
}
