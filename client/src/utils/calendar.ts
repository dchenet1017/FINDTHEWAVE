import type { UserBooking } from '@/types/booking'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** UTC calendar components from scheduledDate (YYYY-MM-DD) + scheduledTime (HH:mm) */
function bookingStartUtc(booking: Pick<UserBooking, 'scheduledDate' | 'scheduledTime'>): Date {
  const [y, m, d] = booking.scheduledDate.split('-').map(Number)
  const [h, min] = booking.scheduledTime.split(':').map(Number)
  return new Date(Date.UTC(y, m - 1, d, h || 0, min || 0, 0, 0))
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function generateICSFile(booking: UserBooking): void {
  const start = bookingStartUtc(booking)
  const end = new Date(start.getTime() + booking.duration * 60 * 60 * 1000)
  const wlName = booking.waveLeader?.displayName ?? 'WaveLeader'
  const loc = booking.location || ''

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WaveFinder//Booking//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${booking.id}@wavefinder.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:WaveFinder — ${wlName}
DESCRIPTION:Service: ${booking.serviceType || 'Session'} with ${wlName}
LOCATION:${loc.replace(/\n/g, ' ')}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wavefinder-booking-${booking.id.slice(0, 8)}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

export function formatCountdown(scheduledDate: string, scheduledTime: string): string {
  const start = bookingStartUtc({ scheduledDate, scheduledTime }).getTime()
  const diff = start - Date.now()
  if (diff <= 0) return 'Started'
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 1) return `in ${days} days`
  if (days === 1) return 'tomorrow'
  if (days === 0 && hours > 1) return `in ${hours} hours`
  if (hours === 1) return 'in 1 hour'
  const mins = Math.max(1, Math.floor(diff / (60 * 1000)))
  return `in ${mins} min`
}
