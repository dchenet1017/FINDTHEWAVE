import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight } from 'lucide-react'
import { useMyEvents } from '@/hooks/useUserEvents'
import { formatEventWhen } from '@/utils/formatEvent'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { MyRegisteredEvent } from '@/types/event'

function CountdownInline({ startIso }: { startIso: string }) {
  const [ms, setMs] = useState(() => Math.max(0, new Date(startIso).getTime() - Date.now()))
  useEffect(() => {
    const id = setInterval(() => {
      setMs(Math.max(0, new Date(startIso).getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [startIso])
  if (ms >= 24 * 60 * 60 * 1000) return null
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const label =
    h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : ms <= 0 ? 'Starting' : `${sec}s`
  return (
    <span className="text-xs font-medium text-amber-400 tabular-nums">Starts in {label}</span>
  )
}

function EventRow({ row, compact }: { row: MyRegisteredEvent; compact?: boolean }) {
  const e = row.event
  return (
    <Link
      to={`/events/${e.id}`}
      className={cn(
        'flex gap-3 rounded-lg border border-gray-800 bg-dark-bg/50 p-3 transition-colors hover:border-primary/30 hover:bg-dark-bg',
        compact && 'p-2'
      )}
    >
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gray-900 border border-gray-800">
        {e.imageUrl ? (
          <img src={e.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Calendar className="h-6 w-6 text-gray-600" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white line-clamp-2 leading-snug">{e.title}</p>
        <p className="text-sm text-gray-400 mt-1">{formatEventWhen(e.startDate)}</p>
        <div className="mt-1">
          <CountdownInline startIso={e.startDate} />
        </div>
      </div>
    </Link>
  )
}

interface EventsWidgetProps {
  /** Tighter layout for profile sidebar */
  compact?: boolean
  className?: string
}

export function EventsWidget({ compact, className }: EventsWidgetProps) {
  const { data, isLoading } = useMyEvents('upcoming')
  const rows = (data ?? []).slice(0, 3)

  return (
    <Card className={cn('bg-dark-card border-gray-800', className)}>
      <CardHeader
        className={cn(
          'flex flex-row items-center justify-between space-y-0',
          compact ? 'p-4 pb-2' : 'p-6 pb-2'
        )}
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          My Events
        </h2>
        <Link
          to="/dashboard/events"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/90 px-2 py-1 rounded-md hover:bg-dark-bg"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className={cn('space-y-3', compact ? 'p-4 pt-0' : 'p-6 pt-0')}>
        {isLoading && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            No upcoming events.{' '}
            <Link to="/events" className="text-primary hover:underline">
              Discover events
            </Link>
          </p>
        )}
        {rows.map((row) => (
          <EventRow key={row.id} row={row} compact={compact} />
        ))}
      </CardContent>
    </Card>
  )
}
