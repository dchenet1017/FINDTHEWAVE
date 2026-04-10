import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  QrCode,
  ExternalLink,
  XCircle,
  PartyPopper,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMyEvents } from '@/hooks/useUserEvents'
import { useCancelEventRegistration } from '@/hooks/useEventRegistration'
import { EventCard } from '@/components/events/EventCard'
import { EventTicket } from '@/components/dashboard/EventTicket'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { formatTicketPrice } from '@/utils/formatEvent'
import { googleCalendarEventUrl, eventDirectionsUrl } from '@/utils/eventLinks'
import type { MyRegisteredEvent } from '@/types/event'

type TabKey = 'upcoming' | 'past' | 'cancelled'

function canCancelRegistration(row: MyRegisteredEvent) {
  if (row.status === 'CANCELLED') return false
  if (row.checkedIn) return false
  return new Date(row.event.startDate).getTime() > Date.now()
}

export default function MyEventsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('upcoming')
  const { data, isLoading, isError } = useMyEvents(tab)
  const cancelReg = useCancelEventRegistration()
  const [ticketRow, setTicketRow] = useState<MyRegisteredEvent | null>(null)

  const rows = data ?? []

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Events</h1>
          <p className="text-gray-400 mt-1">Registrations and tickets</p>
        </div>
        <Button type="button" onClick={() => navigate('/events')}>
          Discover Events
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {isLoading && (
            <p className="text-gray-400 text-center py-16">Loading your events…</p>
          )}
          {isError && (
            <p className="text-red-400 text-center py-16">Could not load events.</p>
          )}
          {!isLoading && !isError && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-gray-800 bg-dark-card/50">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <PartyPopper className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-white">No registered events</h2>
              <p className="text-gray-400 text-center mt-2 max-w-md">
                Browse public events and register to see them here.
              </p>
              <Button type="button" className="mt-6" onClick={() => navigate('/events')}>
                Discover events
              </Button>
            </div>
          )}
          {!isLoading && !isError && rows.length > 0 && (
            <div className="space-y-10">
              {rows.map((row) => (
                <div key={row.id} className="space-y-4">
                  <EventCard event={row.event} navigateOnDetail={false} />
                  <div className="rounded-lg border border-gray-800 bg-dark-card p-4 space-y-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Tickets purchased</span>
                        <p className="text-white font-medium">{row.ticketsPurchased}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total paid</span>
                        <p className="text-white font-medium">
                          {row.totalPaid != null
                            ? formatTicketPrice(row.totalPaid)
                            : formatTicketPrice(row.event.ticketPrice)}
                        </p>
                      </div>
                      {row.status === 'WAITLIST' && (
                        <div>
                          <span className="text-gray-500">Status</span>
                          <p className="text-amber-400 font-medium">Waitlist</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() => setTicketRow(row)}
                      >
                        <QrCode className="h-4 w-4" />
                        QR code
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate(`/events/${row.event.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Event
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          window.open(eventDirectionsUrl(row.event), '_blank', 'noopener,noreferrer')
                        }
                      >
                        <MapPin className="h-4 w-4" />
                        Get Directions
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          window.open(
                            googleCalendarEventUrl(row.event),
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                      >
                        <Calendar className="h-4 w-4" />
                        Add to Calendar
                      </Button>
                      {canCancelRegistration(row) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-400 border-red-900/50 hover:bg-red-950/30"
                          disabled={cancelReg.isPending}
                          onClick={() => {
                            cancelReg.mutate(row.event.id, {
                              onError: () => toast.error('Could not cancel registration'),
                            })
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel Registration
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!ticketRow} onOpenChange={(o) => !o && setTicketRow(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {ticketRow && (
            <>
              <DialogHeader>
                <DialogTitle>Your ticket</DialogTitle>
              </DialogHeader>
              <EventTicket event={ticketRow.event} registration={ticketRow} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
