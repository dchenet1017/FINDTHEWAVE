import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { WaveLeaderBookingClient } from '@/types/booking'
import { formatCurrency } from '@/utils/booking'
import { cn } from '@/lib/utils'

function timeSince(dateStr: string): string {
  const d = new Date(dateStr).getTime()
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (mins > 0) return `${mins} min ago`
  return 'Just now'
}

export interface BookingRequestCardProps {
  booking: WaveLeaderBookingClient
  onAccept: (booking: WaveLeaderBookingClient) => void
  onDecline: (booking: WaveLeaderBookingClient) => void
  onPropose: (booking: WaveLeaderBookingClient) => void
}

export function BookingRequestCard({ booking, onAccept, onDecline, onPropose }: BookingRequestCardProps) {
  const [expanded, setExpanded] = useState(false)
  const client = booking.user
  const avatarUrl =
    client?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.userId}`
  const age = timeSince(booking.createdAt)
  const isUrgent = (Date.now() - new Date(booking.createdAt).getTime()) > 24 * 60 * 60 * 1000

  const subtotal = booking.totalAmount - booking.serviceFee
  const platformFee = booking.serviceFee
  const earnings = subtotal

  const dateLabel = (() => {
    const [y, m, d] = booking.scheduledDate.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })()

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-colors',
        isUrgent ? 'border-amber-500/50 bg-amber-950/20' : 'border-gray-800 bg-gray-900/40'
      )}
    >
      <div className="p-4">
        <div className="flex gap-4">
          <img
            src={avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover border border-gray-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{client?.displayName ?? 'Client'}</p>
                <p className="text-xs text-gray-500 font-mono">{booking.reference}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-amber-400 border-amber-500/30">
                {age}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dateLabel} · {booking.scheduledTime}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {booking.duration}h
              </span>
            </div>
            {booking.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{booking.location}</span>
              </p>
            )}
            <p className="mt-2 text-lg font-bold text-white">
              {formatCurrency(booking.totalAmount)} total
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onAccept(booking)}>
            Accept
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDecline(booking)}>
            Decline
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onPropose(booking)}>
            Propose new time
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {}}
            className="text-gray-400"
          >
            Message user
          </Button>
        </div>

        <button
          type="button"
          className="mt-3 w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 border-t border-gray-800"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? (
            <>
              Less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Earnings breakdown & details <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-800 space-y-3 text-sm">
          <div className="rounded-lg bg-dark-bg p-3 space-y-1">
            <p className="text-gray-400">Booking amount: {formatCurrency(booking.totalAmount)}</p>
            <p className="text-gray-400">Platform fee (15%): -{formatCurrency(platformFee)}</p>
            <p className="font-semibold text-white">Your earnings: {formatCurrency(earnings)}</p>
          </div>
          {booking.serviceType && (
            <p>
              <span className="text-gray-500">Service: </span>
              {booking.serviceType}
            </p>
          )}
          {booking.notes && (
            <p>
              <span className="text-gray-500">Special requests: </span>
              {booking.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
