import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react'
import type { UserBooking } from '@/types/booking'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { formatCurrency, formatTimeRange } from '@/utils/booking'
import { formatCountdown } from '@/utils/calendar'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-gray-500/20 text-gray-400 border-gray-600/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  DECLINED: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export interface BookingCardProps {
  booking: UserBooking
  variant: 'upcoming' | 'past' | 'cancelled'
  onAction: (action: string, booking: UserBooking) => void
}

export function BookingCard({ booking, variant, onAction }: BookingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const wl = booking.waveLeader
  const avatarUrl =
    wl?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.waveLeaderId}`

  const dateLabel = (() => {
    const [y, m, d] = booking.scheduledDate.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })()

  const showCountdown =
    variant === 'upcoming' &&
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)

  const menuItems: { key: string; label: string }[] = []
  if (variant === 'upcoming') {
    menuItems.push(
      { key: 'view', label: 'View details' },
      { key: 'reschedule', label: 'Reschedule' },
      { key: 'cancel', label: 'Cancel' }
    )
  } else if (variant === 'past') {
    menuItems.push({ key: 'view', label: 'View details' })
    if (!booking.rating) {
      menuItems.push({ key: 'review', label: 'Write review' })
    }
  } else {
    menuItems.push(
      { key: 'view', label: 'View details' },
      { key: 'rebook', label: 'Rebook' }
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden transition-colors',
        expanded && 'ring-1 ring-primary/30'
      )}
    >
      <div
        className="p-4 cursor-pointer sm:cursor-default"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault()
            setExpanded((e) => !e)
          }
        }}
      >
        <div className="flex gap-4">
          <img
            src={avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover border border-gray-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white truncate">{wl?.displayName ?? 'WaveLeader'}</p>
                <p className="text-xs text-gray-500 font-mono">{booking.reference}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn('text-xs capitalize', STATUS_STYLES[booking.status] ?? '')}
                >
                  {booking.status.replace('_', ' ').toLowerCase()}
                </Badge>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu
                    align="right"
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  >
                    {menuItems.map((item) => (
                      <DropdownMenuItem key={item.key} onClick={() => onAction(item.key, booking)}>
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-gray-200">
                  {dateLabel} · {formatTimeRange(booking.scheduledTime, booking.duration)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="text-gray-200">{booking.duration}h</span>
              </div>
              {booking.location && (
                <div className="flex items-start gap-2 text-gray-400 sm:col-span-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="text-gray-300 line-clamp-2">{booking.location}</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-lg font-bold text-white">{formatCurrency(booking.totalAmount)}</span>
              {showCountdown && (
                <span className="text-sm text-primary font-medium">
                  {formatCountdown(booking.scheduledDate, booking.scheduledTime)}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="sm:hidden w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 border-t border-gray-800 mt-2"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((x) => !x)
          }}
        >
          {expanded ? (
            <>
              Less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              More <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-800/80 space-y-2 text-sm text-gray-400">
          {booking.serviceType && (
            <p>
              <span className="text-gray-500">Service: </span>
              {booking.serviceType}
            </p>
          )}
          {booking.notes && (
            <p>
              <span className="text-gray-500">Notes: </span>
              {booking.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
