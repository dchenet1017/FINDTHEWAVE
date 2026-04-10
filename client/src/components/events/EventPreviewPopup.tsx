import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Event } from '@/types/event'
import { Button } from '@/components/ui/Button'
import { formatEventWhen, formatTicketPrice } from '@/utils/formatEvent'
import { cn } from '@/lib/utils'

interface EventPreviewPopupProps {
  event: Event
  className?: string
  style?: React.CSSProperties
  onClose: () => void
}

function attendeeShort(event: Event) {
  const c = event.currentAttendees
  const m = event.maxAttendees
  return m == null ? `${c} going` : `${c} / ${m}`
}

export function EventPreviewPopup({ event, className, style, onClose }: EventPreviewPopupProps) {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'relative z-[60] w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-gray-700 bg-dark-card shadow-2xl',
        className
      )}
      style={style}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative h-36 w-full bg-gray-900">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-600">🎟️</div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="pr-8 font-semibold leading-snug text-white line-clamp-2">{event.title}</h3>
        <p className="text-xs text-gray-400">{formatEventWhen(event.startDate)}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-primary">{formatTicketPrice(event.ticketPrice)}</span>
          <span className="text-gray-500">{attendeeShort(event)}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-gray-600"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            View Details
          </Button>
          <Button className="flex-1" onClick={() => navigate(`/events/${event.id}`)}>
            Register
          </Button>
        </div>
      </div>
    </div>
  )
}
