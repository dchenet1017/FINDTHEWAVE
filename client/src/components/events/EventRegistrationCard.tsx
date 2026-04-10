import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Minus, Plus, Ticket } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Event, MyEventRegistration } from '@/types/event'
import { formatEventWhen, formatTicketPrice } from '@/utils/formatEvent'
import { AddToCalendar } from './AddToCalendar'
import { EventQRCode } from './EventQRCode'
import {
  useCancelEventRegistration,
  useRegisterForEvent,
} from '@/hooks/useEventRegistration'
import { format } from 'date-fns'

function spotsLeft(event: Event) {
  if (event.maxAttendees == null) return Infinity
  return Math.max(0, event.maxAttendees - event.currentAttendees)
}

interface EventRegistrationCardProps {
  event: Event
  registration: MyEventRegistration | null | undefined
  registrationLoading: boolean
  isAuthenticated: boolean
}

export function EventRegistrationCard({
  event,
  registration,
  registrationLoading,
  isAuthenticated,
}: EventRegistrationCardProps) {
  const navigate = useNavigate()
  const register = useRegisterForEvent()
  const cancelReg = useCancelEventRegistration()
  const [tickets, setTickets] = useState(1)
  const [showTicket, setShowTicket] = useState(false)

  const left = useMemo(() => spotsLeft(event), [event])
  const maxTickets = Math.min(10, left === Infinity ? 10 : Math.max(1, left))
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null
  const deadlinePassed = deadline ? new Date() > deadline : false
  const soldOut = event.maxAttendees != null && left <= 0
  const price = event.ticketPrice != null ? Number(event.ticketPrice) : 0
  const lineTotal = price * tickets
  const isPaid = price > 0

  const isRegistered =
    registration &&
    (registration.status === 'CONFIRMED' ||
      registration.status === 'REGISTERED' ||
      registration.status === 'ATTENDED')
  const isWaitlist = registration?.status === 'WAITLIST'

  const fillRatio =
    event.maxAttendees != null && event.maxAttendees > 0
      ? Math.min(100, (event.currentAttendees / event.maxAttendees) * 100)
      : 0

  const login = () =>
    navigate('/login', { state: { from: { pathname: `/events/${event.id}` } } })

  const onRegister = () => {
    register.mutate({ eventId: event.id, tickets })
  }

  const onWaitlist = () => {
    register.mutate({ eventId: event.id, tickets: 1, waitlist: true })
  }

  const onCancel = () => {
    if (!window.confirm('Cancel your registration for this event?')) return
    cancelReg.mutate(event.id)
  }

  if (!event.requiresRegistration) {
    return (
      <div className="rounded-xl border border-gray-800 bg-dark-card p-6 text-center text-gray-400">
        No registration required for this event.
      </div>
    )
  }

  if (registrationLoading && isAuthenticated) {
    return (
      <div className="flex justify-center rounded-xl border border-gray-800 bg-dark-card p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isRegistered || isWaitlist) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">
            {isWaitlist ? "You're on the waitlist" : "You're registered!"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {isWaitlist
              ? "We'll notify you if a spot opens."
              : `${registration!.ticketsPurchased} ticket(s) · ${formatTicketPrice(registration!.totalPaid)}`}
          </p>
        </div>

        {!isWaitlist && (
          <>
            {showTicket ? (
              <div className="rounded-lg border border-gray-700 bg-dark-bg/50 p-4">
                <EventQRCode
                  attendeeId={registration!.id}
                  eventTitle={event.title}
                  value={registration!.qrPayload}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-600"
                onClick={() => setShowTicket(true)}
              >
                <Ticket className="mr-2 h-4 w-4" />
                View ticket / QR
              </Button>
            )}
          </>
        )}

        <div className="flex flex-col gap-2">
          <AddToCalendar event={event} variant="outline" className="w-full" />
          {!isWaitlist && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-600/50 text-amber-400 hover:bg-amber-500/10"
              disabled={cancelReg.isPending}
              onClick={onCancel}
            >
              {cancelReg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel registration'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (deadlinePassed) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
        <p className="text-center text-lg font-semibold text-amber-400">Registration closed</p>
        <p className="text-center text-sm text-gray-400">
          The deadline was{' '}
          {deadline ? format(deadline, 'MMM d, yyyy · h:mm a') : 'announced by the organizer'}.
        </p>
        {event.business?.id && (
          <Link
            to={`/business/${event.business.id}`}
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full border-gray-600 text-center')}
          >
            Contact business
          </Link>
        )}
      </div>
    )
  }

  if (soldOut) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
        <p className="text-center text-lg font-semibold text-red-400">Sold out</p>
        <p className="text-center text-sm text-gray-400">All spots are filled.</p>
        {isAuthenticated ? (
          <Button
            type="button"
            className="w-full"
            disabled={register.isPending}
            onClick={onWaitlist}
          >
            {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join waitlist'}
          </Button>
        ) : (
          <Button type="button" className="w-full" onClick={login}>
            Log in to join waitlist
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-xl border border-gray-800 bg-dark-card p-6">
      <div>
        <p className="text-2xl font-bold text-white">{formatTicketPrice(price)}</p>
        {isPaid && (
          <p className="mt-1 text-xs text-amber-200/80">
            Online payment is not charged in-app yet — your registration holds the listed price; pay the
            organizer as instructed.
          </p>
        )}
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm text-gray-400">
          <span>Capacity</span>
          <span>
            {event.currentAttendees}
            {event.maxAttendees != null ? ` / ${event.maxAttendees}` : ''} filled
          </span>
        </div>
        {event.maxAttendees != null && (
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${fillRatio}%` }}
            />
          </div>
        )}
        {left !== Infinity && left > 0 && left <= 5 && (
          <p className="mt-2 text-sm font-medium text-amber-400">Only {left} spot(s) left!</p>
        )}
      </div>

      <p className="text-sm text-gray-300">{formatEventWhen(event.startDate)}</p>

      <div>
        <p className="mb-2 text-sm text-gray-400">Tickets</p>
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-gray-600"
            disabled={tickets <= 1}
            onClick={() => setTickets((t) => Math.max(1, t - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center text-lg font-semibold">{tickets}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-gray-600"
            disabled={tickets >= maxTickets}
            onClick={() => setTickets((t) => Math.min(maxTickets, t + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {isPaid && (
          <p className="mt-2 text-center text-sm text-gray-400">
            Total: <span className="font-semibold text-white">${lineTotal.toFixed(2)}</span>
          </p>
        )}
      </div>

      {!isAuthenticated ? (
        <Button type="button" className="h-12 w-full text-base" onClick={login}>
          Log in to register
        </Button>
      ) : (
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={register.isPending}
          onClick={onRegister}
        >
          {register.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register now'}
        </Button>
      )}

      <AddToCalendar event={event} variant="outline" className="w-full" />
    </div>
  )
}
