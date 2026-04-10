import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { MapPin, Wallet, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import type { Event, MyEventRegistration } from '@/types/event'
import { formatEventWhen } from '@/utils/formatEvent'
import { googleCalendarEventUrl, eventDirectionsUrl } from '@/utils/eventLinks'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function useCountdownTo(targetIso: string) {
  const [ms, setMs] = useState(() => Math.max(0, new Date(targetIso).getTime() - Date.now()))
  useEffect(() => {
    const id = setInterval(() => {
      setMs(Math.max(0, new Date(targetIso).getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [targetIso])
  return ms
}

function formatCountdown(ms: number) {
  if (ms <= 0) return 'Starting now or in progress'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export interface EventTicketProps {
  event: Event
  registration: Pick<MyEventRegistration, 'id' | 'qrPayload' | 'ticketsPurchased'>
  className?: string
}

export function EventTicket({ event, registration, className }: EventTicketProps) {
  const logo = event.business?.imageUrl ?? null
  const countdownMs = useCountdownTo(event.startDate)
  const showCountdown = countdownMs < 24 * 60 * 60 * 1000

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Event ticket</p>
          <h3 className="text-xl font-bold text-white mt-1">{event.title}</h3>
          <p className="text-sm text-primary mt-1">{formatEventWhen(event.startDate)}</p>
          <p className="text-sm text-gray-400 mt-2 flex items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {event.isVirtual
                ? event.virtualLink || 'Virtual event'
                : [event.venueName, event.address].filter(Boolean).join(' · ') || 'Location TBD'}
            </span>
          </p>
        </div>
        {logo ? (
          <img src={logo} alt="" className="h-14 w-14 rounded-lg object-cover border border-gray-700" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-500">
            Logo
          </div>
        )}
      </div>

      {showCountdown && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-center">
          <p className="text-xs text-gray-400">Starts in</p>
          <p className="text-lg font-semibold text-primary tabular-nums">
            {formatCountdown(countdownMs)}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={registration.qrPayload} size={180} level="M" />
        </div>
        <p className="text-xs text-gray-500 text-center max-w-[240px]">
          Show this code at check-in. Ticket #{registration.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="text-sm text-gray-300">
          {registration.ticketsPurchased}{' '}
          {registration.ticketsPurchased === 1 ? 'ticket' : 'tickets'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => window.open(googleCalendarEventUrl(event), '_blank', 'noopener,noreferrer')}
        >
          Add to Calendar
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 gap-2"
          onClick={() => window.open(eventDirectionsUrl(event), '_blank', 'noopener,noreferrer')}
        >
          <Navigation className="h-4 w-4" />
          Get Directions
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => toast.info('Wallet pass download is not available yet.')}
      >
        <Wallet className="h-4 w-4" />
        Add to Wallet
      </Button>
    </div>
  )
}
