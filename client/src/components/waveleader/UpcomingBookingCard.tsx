import { useState } from 'react'
import { MapPin, ExternalLink, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { WaveLeaderBookingClient } from '@/types/booking'
import { formatCurrency, formatTimeRange } from '@/utils/booking'
import { formatCountdown } from '@/utils/calendar'
import { StartSessionButton } from './StartSessionButton'
import { cn } from '@/lib/utils'

export interface UpcomingBookingCardProps {
  booking: WaveLeaderBookingClient
  onViewDetails: (booking: WaveLeaderBookingClient) => void
  onCancel?: (booking: WaveLeaderBookingClient) => void
}

export function UpcomingBookingCard({
  booking,
  onViewDetails,
  onCancel,
}: UpcomingBookingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const client = booking.user
  const avatarUrl =
    client?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.userId}`

  const dateLabel = (() => {
    const [y, m, d] = booking.scheduledDate.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })()

  const mapsUrl = booking.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`
    : null

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="p-4">
        <div className="flex gap-4">
          <img
            src={avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover border border-gray-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{client?.displayName ?? 'Client'}</p>
            <p className="text-xs text-gray-500 font-mono">{booking.reference}</p>
            <p className="mt-2 text-gray-300">
              {dateLabel} · {formatTimeRange(booking.scheduledTime, booking.duration)}
            </p>
            <p className="text-sm text-primary font-medium mt-1">
              {formatCountdown(booking.scheduledDate, booking.scheduledTime)}
            </p>
            <p className="text-lg font-bold text-white mt-2">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => onViewDetails(booking)}>
            View details
          </Button>
          <StartSessionButton booking={booking} />
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="text-gray-400">
                <MapPin className="h-4 w-4 mr-1" />
                Get directions
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400"
            onClick={() => {}}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Message user
          </Button>
          {onCancel && (
            <Button size="sm" variant="destructive" onClick={() => onCancel(booking)}>
              Cancel
            </Button>
          )}
        </div>

        <button
          type="button"
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 border-t border-gray-800',
            expanded && 'border-b-0'
          )}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Hide notes' : 'Notes & location'}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-800 space-y-2 text-sm text-gray-400">
          {booking.location && (
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              {booking.location}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1">
                  Get directions <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
          )}
          {booking.notes && <p><span className="text-gray-500">Notes: </span>{booking.notes}</p>}
        </div>
      )}
    </div>
  )
}
