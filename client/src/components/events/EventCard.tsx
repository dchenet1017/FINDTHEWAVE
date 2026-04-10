import { useNavigate } from 'react-router-dom'
import { MapPin, Video, Sparkles } from 'lucide-react'
import { cn, formatDistance } from '@/lib/utils'
import { calculateDistance } from '@/lib/mapbox'
import type { Event } from '@/types/event'
import { EVENT_CATEGORY_ICONS, categoryColor } from './eventMapConfig'
import { formatEventWhen, formatTicketPrice } from '@/utils/formatEvent'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

export interface EventCardProps {
  event: Event
  onClick?: () => void
  userLat?: number
  userLng?: number
}

function attendeeLabel(event: Event) {
  const cur = event.currentAttendees
  const max = event.maxAttendees
  if (max == null) return `${cur} going`
  return `${cur}/${max} going`
}

function capacityBadge(event: Event) {
  const max = event.maxAttendees
  if (max == null) return null
  const left = max - event.currentAttendees
  if (left <= 0) {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Sold Out
      </Badge>
    )
  }
  if (left <= Math.max(3, Math.ceil(max * 0.1))) {
    return (
      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
        Almost Full
      </Badge>
    )
  }
  return null
}

export function EventCard({
  event,
  onClick,
  userLat,
  userLng,
  navigateOnDetail = true,
}: EventCardProps) {
  const navigate = useNavigate()

  const distanceMi =
    userLat != null && userLng != null
      ? calculateDistance(userLat, userLng, event.latitude, event.longitude)
      : event.distanceMiles

  const locationLine =
    event.venueName || event.address || event.business?.name || 'Location TBD'

  const handleClick = () => {
    onClick?.()
    if (navigateOnDetail) navigate(`/events/${event.id}`)
  }

  return (
    <Card
      role={navigateOnDetail ? 'button' : undefined}
      tabIndex={navigateOnDetail ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (!navigateOnDetail) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        'group overflow-hidden border-gray-800 bg-dark-card transition-all',
        navigateOnDetail
          ? 'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
          : 'cursor-default'
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl"
            style={{ backgroundColor: `${categoryColor(event.category)}22` }}
          >
            {EVENT_CATEGORY_ICONS[event.category]}
          </div>
        )}
        <div
          className="absolute left-2 top-2 flex flex-wrap gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Badge
            className="border-0 text-[10px]"
            style={{ backgroundColor: categoryColor(event.category) }}
          >
            {EVENT_CATEGORY_ICONS[event.category]}{' '}
            {event.category.replace(/_/g, ' ')}
          </Badge>
          {event.isVirtual && (
            <Badge className="bg-cyan-600/90 text-[10px]">
              <Video className="mr-0.5 h-3 w-3 inline" />
              Virtual
            </Badge>
          )}
          {capacityBadge(event)}
        </div>
        {event.featuredWaveLeader && (
          <div className="absolute right-2 top-2">
            <Badge className="bg-violet-600/90 gap-1 text-[10px]">
              <Sparkles className="h-3 w-3" />
              WaveLeader
            </Badge>
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 font-semibold text-white group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <p className="text-sm text-gray-400">{event.business?.name ?? 'Venue'}</p>
        <p className="text-sm text-gray-300">{formatEventWhen(event.startDate)}</p>
        <div className="flex items-start gap-1.5 text-sm text-gray-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <span className="line-clamp-2">
            {locationLine}
            {distanceMi != null && (
              <span className="text-gray-500"> · {formatDistance(distanceMi)}</span>
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-sm font-medium text-primary">
            {formatTicketPrice(event.ticketPrice)}
          </span>
          <span className="text-xs text-gray-500">{attendeeLabel(event)}</span>
        </div>
      </div>
    </Card>
  )
}
