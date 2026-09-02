import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Decorative stylised map for the "Join the Wave" step. Deliberately not a real
 * Mapbox canvas: this renders before the user has granted location permission,
 * so there is nothing true to centre on yet and no reason to spend a map load.
 */

interface Pulse {
  /** percentage coordinates within the frame */
  x: number
  y: number
  delay: number
  size: number
}

const PULSES: Pulse[] = [
  { x: 26, y: 30, delay: 0, size: 10 },
  { x: 68, y: 22, delay: 0.9, size: 8 },
  { x: 78, y: 58, delay: 1.7, size: 11 },
  { x: 38, y: 70, delay: 0.45, size: 8 },
  { x: 16, y: 56, delay: 2.2, size: 7 },
  { x: 56, y: 44, delay: 1.3, size: 9 },
]

// Faux street grid - a couple of angled roads keep it from reading as graph paper
const ROADS = [
  'M0 34 H100',
  'M0 66 H100',
  'M30 0 V100',
  'M72 0 V100',
  'M0 88 L100 52',
  'M8 0 L58 100',
]

export function MiniPulseMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#12101c]',
        className
      )}
      aria-hidden
    >
      {/* Street grid */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id="wf-map-glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#wf-map-glow)" />
        {ROADS.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#ffffff"
            strokeOpacity={i > 3 ? 0.05 : 0.08}
            strokeWidth={i > 3 ? 0.6 : 0.9}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Activity pulses */}
      {PULSES.map((pulse, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pulse.x}%`, top: `${pulse.y}%` }}
        >
          <motion.span
            className="absolute left-1/2 top-1/2 rounded-full bg-primary"
            style={{
              width: pulse.size * 3,
              height: pulse.size * 3,
              marginLeft: -(pulse.size * 3) / 2,
              marginTop: -(pulse.size * 3) / 2,
            }}
            initial={{ scale: 0.4, opacity: 0.45 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{
              duration: 2.6,
              delay: pulse.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <span
            className="relative block rounded-full bg-primary-light shadow-[0_0_12px_rgba(108,92,231,0.9)]"
            style={{ width: pulse.size, height: pulse.size }}
          />
        </div>
      ))}

      {/* "You" marker, sweeping to suggest a live fix */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.span
          className="absolute left-1/2 top-1/2 -ml-9 -mt-9 rounded-full border border-secondary/40"
          style={{ height: 72, width: 72 }}
          initial={{ scale: 0.5, opacity: 0.7 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-[#12101c] bg-secondary shadow-[0_0_16px_rgba(0,210,211,0.9)]" />
      </div>

      {/* Vignette so pulses fade toward the frame */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12101c] via-transparent to-transparent" />
    </div>
  )
}
