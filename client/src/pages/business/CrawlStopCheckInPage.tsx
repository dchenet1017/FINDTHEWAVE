import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { QRCodeScanner } from '@/components/events/QRCodeScanner'
import { useBusinessCrawl, useCheckInAtStop, useMyCrawlStops } from '@/hooks/useBusinessCrawls'

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

type FeedItem = { id: string; label: string }

export default function CrawlStopCheckInPage() {
  const { id } = useParams<{ id: string }>()
  const { data: crawl, isLoading: crawlLoading } = useBusinessCrawl(id)
  const { data: myStops = [], isLoading: stopsLoading } = useMyCrawlStops()
  const checkInMut = useCheckInAtStop()

  const [scanKey, setScanKey] = useState(0)
  const [manualId, setManualId] = useState('')
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])

  const myStop = myStops.find((s) => s.crawlId === id)

  const showFlash = useCallback((ok: boolean, msg: string) => {
    setFlash({ ok, msg })
    playTone(ok)
    setTimeout(() => setFlash(null), 2500)
  }, [])

  const runCheckIn = useCallback(
    (attendeeId: string) => {
      if (!id || !myStop) return
      checkInMut.mutate(
        { crawlId: id, stopId: myStop.stopId, attendeeId },
        {
          onSuccess: (data) => {
            if (data.alreadyCheckedIn) {
              showFlash(true, 'Already checked in at this stop')
            } else if (data.bonusAwarded) {
              showFlash(true, 'Checked in — crawl complete, bonus awarded!')
              setFeed((p) => [{ id: `${attendeeId}-${Date.now()}`, label: 'Completed the crawl!' }, ...p.slice(0, 19)])
            } else {
              showFlash(true, `Checked in (${data.stopsCompleted}/${data.totalStops} stops)`)
              setFeed((p) => [
                { id: `${attendeeId}-${Date.now()}`, label: `Stop ${data.stopsCompleted} of ${data.totalStops}` },
                ...p.slice(0, 19),
              ])
            }
          },
          onError: () => showFlash(false, 'Check-in failed — unknown attendee'),
        }
      )
    },
    [id, myStop, checkInMut, showFlash]
  )

  const onScan = useCallback(
    (text: string) => {
      let attendeeId = text.trim()
      try {
        const parsed = JSON.parse(text) as { attendeeId?: string }
        if (parsed?.attendeeId) attendeeId = parsed.attendeeId
      } catch {
        /* raw id */
      }
      runCheckIn(attendeeId)
      setScanKey((k) => k + 1)
    },
    [runCheckIn]
  )

  if (crawlLoading || stopsLoading || !id) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12 text-white">
      <Link to="/business/crawls" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Crawls
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Stop Check-in</h1>
        <p className="mt-1 text-gray-400">{crawl?.title}</p>
      </div>

      {!myStop ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-dark-card/50 px-6 py-10 text-center text-sm text-gray-400">
          Your business isn't a stop on this crawl, so you can't check attendees in here.
        </div>
      ) : (
        <>
          {flash && (
            <div
              className={
                flash.ok
                  ? 'flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success'
                  : 'flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger'
              }
            >
              {flash.ok ? <Check className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {flash.msg}
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">QR scanner</h2>
            <p className="text-sm text-gray-400">
              Allow camera access. Scanning the attendee's crawl QR code checks them in at this stop automatically.
            </p>
            <QRCodeScanner remountKey={scanKey} onScan={onScan} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Manual entry</h2>
            <p className="text-sm text-gray-400">
              If the QR code won't scan, ask the guest for their registration ID and enter it here.
            </p>
            <div className="flex gap-2">
              <Label htmlFor="manualId" className="sr-only">
                Attendee ID
              </Label>
              <Input
                id="manualId"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Attendee ID"
              />
              <Button
                loading={checkInMut.isPending}
                onClick={() => {
                  if (!manualId.trim()) return
                  runCheckIn(manualId.trim())
                  setManualId('')
                }}
              >
                Check in
              </Button>
            </div>
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
                    className="rounded-lg border border-gray-800 bg-dark-card px-3 py-2 text-sm"
                  >
                    {item.label}
                  </motion.li>
                ))}
              </AnimatePresence>
              {!feed.length && <p className="text-sm text-gray-500">Check-ins will appear here.</p>}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
