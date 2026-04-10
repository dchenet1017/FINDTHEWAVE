import type { BookingPaymentDraft } from '@/types/booking-payment'

const KEY = 'wavefinder_booking_draft'

export function saveBookingDraft(draft: BookingPaymentDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // ignore
  }
}

export function loadBookingDraft(waveLeaderId: string): BookingPaymentDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as BookingPaymentDraft & { meetingLocation?: string }
    if (p?.waveLeaderId === waveLeaderId) {
      if (!p.location && p.meetingLocation) p.location = p.meetingLocation
      return p as BookingPaymentDraft
    }
  } catch {
    // ignore
  }
  return null
}

export function clearBookingDraft() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
