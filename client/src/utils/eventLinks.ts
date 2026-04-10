import type { Event } from '@/types/event'

function gcalUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function googleCalendarEventUrl(event: Event) {
  const start = gcalUtc(new Date(event.startDate))
  const end = gcalUtc(new Date(event.endDate))
  const location = event.isVirtual
    ? event.virtualLink || 'Online'
    : [event.venueName, event.address].filter(Boolean).join(', ')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: (event.description || '').slice(0, 800),
    location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function eventDirectionsUrl(event: Event) {
  if (event.latitude != null && event.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
  }
  const q = [event.venueName, event.address, event.business?.name].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || 'Event')}`
}
