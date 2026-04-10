import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  MoreVertical,
  Ticket,
  Users,
  Eye,
  LayoutGrid,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useBusinessEventStats,
  useBusinessEvents,
  useDeleteEvent,
  useCancelEvent,
  useDuplicateEvent,
  type BusinessEventsTab,
} from '@/hooks/useBusinessEvents'
import type { Event } from '@/types/event'
import { cn } from '@/lib/utils'

function statusBadge(event: Event) {
  if (event.status === 'CANCELLED') {
    return <Badge variant="destructive">Cancelled</Badge>
  }
  if (event.status === 'DRAFT' || !event.isPublished) {
    return <Badge variant="warning">Draft</Badge>
  }
  return <Badge className="bg-primary/20 text-primary border-primary/30">Published</Badge>
}

function EventRow({
  event,
  onAction,
}: {
  event: Event
  onAction: (action: string, e: Event) => void
}) {
  const max = event.maxAttendees
  const reg = event.registrations ?? event.currentAttendees ?? 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-dark-card p-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 gap-4 min-w-0">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-900">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">
              <CalendarDays className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white truncate">{event.title}</h3>
            {statusBadge(event)}
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {(() => {
              try {
                return format(parseISO(event.startDate), 'PPp')
              } catch {
                return event.startDate
              }
            })()}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {reg}
              {max != null ? ` / ${max}` : ''} registered
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {event.views ?? 0} views
            </span>
          </div>
        </div>
      </div>
      <DropdownMenu
        align="right"
        trigger={
          <Button variant="outline" size="icon" className="shrink-0 self-start sm:self-center">
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
      >
        <DropdownMenuItem onClick={() => onAction('view', event)}>View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('edit', event)}>Edit event</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('attendees', event)}>View attendees</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('checkin', event)}>Check-in attendees</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('duplicate', event)}>Duplicate event</DropdownMenuItem>
        {event.status !== 'CANCELLED' && event.status !== 'DRAFT' && (
          <DropdownMenuItem onClick={() => onAction('cancel', event)}>Cancel event</DropdownMenuItem>
        )}
        {event.status === 'DRAFT' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onClick={() => onAction('delete', event)}
            >
              Delete event
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenu>
    </div>
  )
}

export default function EventsManagementPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<BusinessEventsTab>('upcoming')
  const { data: stats, isLoading: statsLoading } = useBusinessEventStats()
  const { data: events = [], isLoading: listLoading } = useBusinessEvents(tab)
  const deleteMut = useDeleteEvent()
  const cancelMut = useCancelEvent()
  const dupMut = useDuplicateEvent()

  const onAction = (action: string, e: Event) => {
    switch (action) {
      case 'view':
        window.open(`/events/${e.id}`, '_blank', 'noopener,noreferrer')
        break
      case 'edit':
        navigate(`/business/events/${e.id}/edit`)
        break
      case 'attendees':
        navigate(`/business/events/${e.id}/attendees`)
        break
      case 'checkin':
        navigate(`/business/events/${e.id}/check-in`)
        break
      case 'duplicate':
        dupMut.mutate(e.id, {
          onSuccess: (copy) => navigate(`/business/events/${copy.id}/edit`),
        })
        break
      case 'cancel':
        if (window.confirm('Cancel this event? It will be unpublished.')) cancelMut.mutate(e.id)
        break
      case 'delete':
        if (window.confirm('Permanently delete this draft?')) deleteMut.mutate(e.id)
        break
      default:
        break
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Events</h1>
          <p className="mt-1 text-sm text-gray-400">Create and manage events for your customers.</p>
        </div>
        <Link
          to="/business/events/create"
          className={cn(buttonVariants({ size: 'lg' }), 'shrink-0 text-center')}
        >
          Create Event
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Events', value: stats?.totalEvents, icon: LayoutGrid },
          { label: 'Upcoming', value: stats?.upcomingEvents, icon: CalendarDays },
          { label: 'Registrations', value: stats?.totalRegistrations, icon: Ticket },
          { label: 'Check-ins', value: stats?.totalCheckIns, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-800 bg-dark-card p-4 flex flex-col gap-2"
          >
            <Icon className="h-5 w-5 text-primary" />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-semibold">
              {statsLoading ? '—' : value ?? 0}
            </p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as BusinessEventsTab)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 sm:flex-none">
            Past
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex-1 sm:flex-none">
            Drafts
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {listLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-dark-card/50 px-6 py-20 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <CalendarDays className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-white">No events yet</h2>
              <p className="mt-2 max-w-sm text-sm text-gray-400">
                Promote your business with workshops, tastings, and community gatherings.
              </p>
              <Link
                to="/business/events/create"
                className={cn(buttonVariants({ size: 'lg' }), 'mt-6')}
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <ul className={cn('space-y-4')}>
              {events.map((ev) => (
                <li key={ev.id}>
                  <EventRow event={ev} onAction={onAction} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
