import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Search, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { QRCodeScanner } from '@/components/events/QRCodeScanner'
import {
  useBusinessEvent,
  useEventAttendees,
  useCheckInScan,
  useCheckInAttendee,
  type EventAttendeeRow,
} from '@/hooks/useBusinessEvents'
import { cn } from '@/lib/utils'

function playTone(ok: boolean) {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = ok ? 880 : 220
    g.gain.value = 0.08
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.12)
  } catch {
    /* ignore */
  }
}

type FeedItem = {
  id: string
  name: string
  avatar: string | null
  time: string
}

export default function EventCheckInPage() {
  const { id } = useParams<{ id: string }>()
  const { data: event, isLoading: evLoading } = useBusinessEvent(id)
  const { data: attendees = [], refetch } = useEventAttendees(id)
  const scanMut = useCheckInScan()
  const manualMut = useCheckInAttendee()

  const [scanKey, setScanKey] = useState(0)
  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [confirmRow, setConfirmRow] = useState<EventAttendeeRow | null>(null)

  const showFlash = useCallback((ok: boolean, msg: string) => {
    setFlash({ ok, msg })
    playTone(ok)
    setTimeout(() => setFlash(null), 2200)
  }, [])

  const pushFeed = useCallback((row: EventAttendeeRow) => {
    const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Guest'
    setFeed((prev) => [
      {
        id: `${row.id}-${Date.now()}`,
        name,
        avatar: row.avatar,
        time: new Date().toISOString(),
      },
      ...prev.slice(0, 19),
    ])
  }, [])

  const onScan = useCallback(
    (text: string) => {
      if (!id) return
      scanMut.mutate(
        { eventId: id, scan: text },
        {
          onSuccess: (data) => {
            if (data.alreadyCheckedIn) showFlash(true, 'Already checked in')
            else {
              showFlash(true, 'Checked in!')
              setScanKey((k) => k + 1)
              void refetch().then((res) => {
                const list = res.data || []
                const row = list.find((a) => a.id === data.attendeeId)
                if (row) pushFeed(row)
              })
            }
          },
          onError: () => {
            showFlash(false, 'Invalid or unknown QR')
            setScanKey((k) => k + 1)
          },
        }
      )
    },
    [id, scanMut, refetch, showFlash, pushFeed]
  )

  const listFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const open = attendees.filter((a) => !a.checkedIn && a.status !== 'CANCELLED')
    if (!q) return open.slice(0, 50)
    return open.filter((a) => {
      const name = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase()
      return name.includes(q) || a.email.toLowerCase().includes(q)
    })
  }, [attendees, query])

  const registered = attendees.filter((a) => a.status !== 'CANCELLED').length
  const checked = attendees.filter((a) => a.checkedIn).length
  const pending = Math.max(registered - checked, 0)

  if (evLoading || !id) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-white pb-12">
      <Link
        to={`/business/events/${id}/attendees`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Attendees
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Check-in</h1>
        <p className="mt-1 text-gray-400">{event?.title}</p>
      </div>

      {flash && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
            flash.ok
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-danger/40 bg-danger/10 text-danger'
          )}
        >
          {flash.ok ? <Check className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          {flash.msg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-dark-card p-4">
          <p className="text-xs text-gray-500">Registered</p>
          <p className="text-2xl font-bold">{registered}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-dark-card p-4">
          <p className="text-xs text-gray-500">Checked in</p>
          <p className="text-2xl font-bold text-primary">{checked}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-dark-card p-4">
          <p className="text-xs text-gray-500">Not yet arrived</p>
          <p className="text-2xl font-bold">{pending}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">QR scanner</h2>
        <p className="text-sm text-gray-400">
          Allow camera access. Each successful scan checks in the attendee automatically.
        </p>
        <QRCodeScanner remountKey={scanKey} onScan={onScan} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Manual check-in</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-800 p-2">
          {listFiltered.map((row) => {
            const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Guest'
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-800/80"
                  onClick={() => setConfirmRow(row)}
                >
                  <span className="flex items-center gap-2">
                    <Avatar src={row.avatar || undefined} fallback={name[0] || '?'} size="sm" />
                    <span className="font-medium">{name}</span>
                  </span>
                  <span className="text-xs text-gray-500">{row.email}</span>
                </button>
              </li>
            )
          })}
          {!listFiltered.length && (
            <li className="px-3 py-6 text-center text-sm text-gray-500">No matches</li>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent check-ins</h2>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {feed.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-lg border border-gray-800 bg-dark-card px-3 py-2"
              >
                <Avatar src={item.avatar || undefined} fallback={item.name[0] || '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {(() => {
                      try {
                        return format(parseISO(item.time), 'p')
                      } catch {
                        return item.time
                      }
                    })()}
                  </p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          {!feed.length && (
            <p className="text-sm text-gray-500">Check-ins will appear here in real time.</p>
          )}
        </ul>
      </section>

      <Dialog open={!!confirmRow} onOpenChange={(o) => !o && setConfirmRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check in attendee?</DialogTitle>
          </DialogHeader>
          {confirmRow && (
            <p className="text-sm text-gray-400">
              {[confirmRow.firstName, confirmRow.lastName].filter(Boolean).join(' ') || 'Guest'} (
              {confirmRow.email})
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmRow(null)}>
              Cancel
            </Button>
            <Button
              loading={manualMut.isPending}
              onClick={() => {
                if (!id || !confirmRow) return
                const row = confirmRow
                manualMut.mutate(
                  { eventId: id, attendeeId: row.id, method: 'MANUAL' },
                  {
                    onSuccess: (data) => {
                      setConfirmRow(null)
                      if (!data.alreadyCheckedIn) {
                        showFlash(true, 'Checked in!')
                        pushFeed(row)
                      } else showFlash(true, 'Already checked in')
                    },
                    onError: () => showFlash(false, 'Check-in failed'),
                  }
                )
              }}
            >
              Confirm check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
