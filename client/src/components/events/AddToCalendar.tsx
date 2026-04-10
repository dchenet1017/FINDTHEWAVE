import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import type { Event } from '@/types/event'

function formatICSUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function googleOutlookDates(start: Date, end: Date) {
  const a = formatICSUtc(start)
  const b = formatICSUtc(end)
  return { google: `${a}/${b}`, outlookStart: a, outlookEnd: b }
}

function buildGoogleUrl(event: Event) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const { google } = googleOutlookDates(start, end)
  const loc =
    event.isVirtual && event.virtualLink
      ? event.virtualLink
      : [event.venueName, event.address].filter(Boolean).join(', ') || ''
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: google,
    details: event.description.slice(0, 800),
    location: loc,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildOutlookUrl(event: Event) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const { outlookStart, outlookEnd } = googleOutlookDates(start, end)
  const loc =
    event.isVirtual && event.virtualLink
      ? event.virtualLink
      : [event.venueName, event.address].filter(Boolean).join(', ') || ''
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description.slice(0, 2000),
    location: loc,
    startdt: outlookStart,
    enddt: outlookEnd,
    allday: 'false',
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

export function generateICSFile(event: Event) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const loc =
    event.isVirtual && event.virtualLink
      ? event.virtualLink
      : [event.venueName, event.address].filter(Boolean).join(', ') || 'TBD'

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wavefinder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSUtc(start)}`,
    `DTEND:${formatICSUtc(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description.slice(0, 4000))}`,
    `LOCATION:${escapeIcs(loc)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title.replace(/[^\w\d]+/g, '-').slice(0, 60)}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

interface AddToCalendarProps {
  event: Event
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function AddToCalendar({ event, variant = 'outline', className }: AddToCalendarProps) {
  return (
    <DropdownMenu
      align="left"
      trigger={
        <Button type="button" variant={variant} className={className}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      }
    >
      <DropdownMenuItem onClick={() => generateICSFile(event)}>
        Download .ics (Apple &amp; others)
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          window.open(buildGoogleUrl(event), '_blank', 'noopener,noreferrer')
        }}
      >
        Google Calendar
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          window.open(buildOutlookUrl(event), '_blank', 'noopener,noreferrer')
        }}
      >
        Outlook.com
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
