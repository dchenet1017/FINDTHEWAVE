import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useRaiseHand } from '@/hooks/useGoOut'
import { getCurrentPosition } from '@/lib/mapbox'
import { PARTY_SIZE_OPTIONS, VIBE_OPTIONS, type Vibe } from '@/types/goOut'

interface GoOutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Bottom sheet for raising a hand: what you're in the mood for, who's coming.
 * Location is captured on submit rather than on open, so the browser prompt
 * only ever follows a deliberate tap.
 */
export function GoOutSheet({ open, onOpenChange }: GoOutSheetProps) {
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [partySize, setPartySize] = useState(1)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const raiseHand = useRaiseHand()

  const toggleVibe = (vibe: Vibe) => {
    setVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    )
  }

  const reset = () => {
    setVibes([])
    setPartySize(1)
    setLocationError(null)
  }

  const close = () => {
    onOpenChange(false)
    reset()
  }

  const submit = async () => {
    if (vibes.length === 0) return

    setLocationError(null)
    setLocating(true)
    let coords: { latitude: number; longitude: number }
    try {
      const position = await getCurrentPosition()
      coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    } catch {
      // Without a location there is nothing to match venues against, so stop
      // here rather than broadcasting a meaningless intent at (0, 0).
      setLocating(false)
      setLocationError(
        'We need your location to show venues nearby. Enable location access and try again.'
      )
      return
    }
    setLocating(false)

    raiseHand.mutate(
      { vibes, partySize, ...coords },
      { onSuccess: () => close() }
    )
  }

  const busy = locating || raiseHand.isPending

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="I want to go out"
            className="fixed inset-x-0 bottom-0 z-[95] max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-gray-700 bg-dark-card"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="mx-auto w-full max-w-lg px-6 pb-8 pt-3">
              {/* Grabber */}
              <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-gray-600" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    What are you in the mood for?
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-400">
                    Venues nearby will come to you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Vibes */}
              <div className="mt-7">
                <span className="text-sm font-medium text-gray-300">Your vibe</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {VIBE_OPTIONS.map(({ value, label, emoji }) => {
                    const selected = vibes.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleVibe(value)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          selected
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-700 bg-dark-bg text-gray-300 hover:border-gray-600 hover:text-white'
                        )}
                      >
                        <span className="mr-1.5" aria-hidden>
                          {emoji}
                        </span>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Party size */}
              <div className="mt-7">
                <span className="text-sm font-medium text-gray-300">How many of you?</span>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {PARTY_SIZE_OPTIONS.map(({ value, label }) => {
                    const selected = partySize === value
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setPartySize(value)}
                        className={cn(
                          'rounded-xl border px-2 py-3 text-sm font-medium transition-all',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          selected
                            ? 'border-primary bg-primary/15 text-white'
                            : 'border-gray-700 bg-dark-bg text-gray-400 hover:border-gray-600 hover:text-white'
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {locationError && (
                <p className="mt-5 flex items-start gap-2 text-sm text-danger" role="alert">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{locationError}</span>
                </p>
              )}

              <Button
                size="lg"
                className="mt-8 w-full text-base"
                disabled={vibes.length === 0 || busy}
                onClick={submit}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {locating ? 'Finding you…' : 'Raise my hand 🙋'}
              </Button>

              <p className="mt-3 text-center text-xs text-gray-500">
                Your hand stays up for 2 hours. Venues see the crowd, never your name.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
