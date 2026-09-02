import { useCallback, useEffect, useRef } from 'react'
import { KeyRound, MapPin, Sparkles } from 'lucide-react'
import type { BusinessOffer } from '@/types/goOut'

interface AcceptedOfferCelebrationProps {
  offer: BusinessOffer | null
  onClose: () => void
}

/** How long the overlay stays up before dismissing itself. */
const AUTO_DISMISS_MS = 3000

/**
 * Full-screen confirmation shown the moment a user accepts a venue's offer.
 *
 * Animated with Tailwind keyframes (see tailwind.config.js) rather than
 * framer-motion - it is a one-shot overlay, not something worth a physics
 * engine. Dismisses on tap or after AUTO_DISMISS_MS.
 */
export function AcceptedOfferCelebration({
  offer,
  onClose,
}: AcceptedOfferCelebrationProps) {
  const offerId = offer?.id

  /*
   * Callers pass an inline arrow (`onClose={() => setAccepted(null)}`), so its
   * identity changes on every parent render. Holding it in a ref keeps those
   * renders - a poll landing, a mutation settling - from restarting the
   * countdown, which would stop it from ever firing.
   */
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const close = useCallback(() => onCloseRef.current(), [])

  // Restart the countdown only when a different offer is celebrated.
  useEffect(() => {
    if (!offerId) return
    const timer = window.setTimeout(close, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [offerId, close])

  // Escape dismisses too, and the page behind must not scroll.
  useEffect(() => {
    if (!offerId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [offerId, close])

  if (!offer) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Offer accepted"
      onClick={close}
      className="animate-wf-fade-in fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-dark-bg/95 px-6 backdrop-blur-sm"
    >
      {/* Soft glow behind the dancer */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-72 w-72 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="animate-wf-pop-in relative flex w-full max-w-sm flex-col items-center text-center">
        <span
          aria-hidden
          className="animate-wf-dance text-7xl drop-shadow-[0_8px_24px_rgba(108,92,231,0.6)] sm:text-8xl"
        >
          🕺
        </span>

        <h2 className="animate-wf-rise-in mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          You&apos;re in!
        </h2>

        {offer.business && (
          <p className="animate-wf-rise-in mt-3 text-xl font-semibold text-primary-light">
            {offer.business.name}
          </p>
        )}

        <p className="animate-wf-rise-in mt-5 flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3.5 text-left text-base font-medium text-white">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-light" />
          <span>{offer.perkDescription}</span>
        </p>

        {offer.doorCode && (
          <div className="animate-wf-rise-in mt-3 w-full rounded-2xl border border-primary/40 bg-dark-card px-5 py-4">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-light">
              <KeyRound className="h-3.5 w-3.5" />
              Door code
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-white">
              {offer.doorCode}
            </p>
          </div>
        )}

        {offer.business?.address && (
          <p className="animate-wf-rise-in mt-4 flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{offer.business.address}</span>
          </p>
        )}

        {/* Countdown to the auto-dismiss, so the overlay never feels abrupt */}
        <div
          aria-hidden
          className="mt-9 h-0.5 w-28 overflow-hidden rounded-full bg-white/10"
        >
          <div className="animate-wf-countdown h-full w-full origin-left rounded-full bg-primary" />
        </div>
        <p className="mt-3 text-xs text-gray-500">Tap anywhere to continue</p>
      </div>
    </div>
  )
}
