import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  DollarSign,
  Gift,
  Home,
  Map as MapIcon,
  MapPinned,
  Maximize2,
  Megaphone,
  Radio,
  Send,
  Settings,
  Star,
  Users,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LandingMap } from './LandingMap'

/**
 * Hero centerpiece: the business console as an operator actually sees it.
 *
 * Hand-built rather than a real capture - this ships from a marketing page
 * with no signed-in session - but every label, metric, nav entry and marker
 * colour is taken from the live product (BusinessSidebar, BusinessDashboard,
 * StatCard, BusinessDemandPanel, MapWidget, BusinessCard, RevenueChart). It
 * keeps the in-app palette (dark-bg/dark-card + purple primary) rather than the
 * navy marketing one, so it reads as a screenshot of WaveFinder.
 */

const NAV_ITEMS: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: 'Dashboard', icon: Home, active: true },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'My Location', icon: MapIcon },
  { label: 'Advertisements', icon: Megaphone },
  { label: 'Events', icon: CalendarDays },
  { label: 'Bar Crawls', icon: MapPinned },
  { label: 'Go Out Queue', icon: Radio },
  { label: 'Promotions', icon: Gift },
  { label: 'Reviews', icon: Star },
  { label: 'Customers', icon: Users },
  { label: 'Revenue', icon: DollarSign },
  { label: 'Settings', icon: Settings },
]

/** Mirrors VIBE_OPTIONS in @/types/goOut. Counts add up to the 18 hands raised. */
const DEMAND_BY_VIBE = [
  { emoji: '\u{1F307}', label: 'Rooftop', count: 7 },
  { emoji: '\u{1F378}', label: 'Drinks', count: 5 },
  { emoji: '\u{1F483}', label: 'Dancing', count: 4 },
  { emoji: '\u{1F3B8}', label: 'Live Music', count: 2 },
]

/**
 * Marker colours are the real ones: BUSINESS_TYPE_COLORS in map/BusinessCard,
 * the cluster steps in BusinessMarkerLayer, and the amber event circles.
 */
const MAP_MARKERS = [
  { x: 24, y: 30, size: 18, color: '#6C5CE7', count: '12' },
  { x: 77, y: 64, size: 15, color: '#9C88FF', count: '7' },
  { x: 34, y: 73, size: 7, color: '#FF5E7D' },
  { x: 63, y: 24, size: 7, color: '#01D1A2' },
  { x: 71, y: 82, size: 7, color: '#9C6BFF' },
  { x: 14, y: 55, size: 7, color: '#74B9FF' },
  { x: 88, y: 33, size: 7, color: '#F59E0B' },
  { x: 61, y: 91, size: 7, color: '#FF5E7D' },
]

const MAP_LEGEND = [
  { color: '#6C5CE7', label: 'Your venue' },
  { color: '#FF5E7D', label: 'Bars' },
  { color: '#01D1A2', label: 'Restaurants' },
]

interface PreviewStat {
  title: string
  value: string
  subtitle: string
  trend?: string
  icon: LucideIcon
  tint: string
  ring: string
  iconColor: string
}

const STATS: PreviewStat[] = [
  {
    title: 'Today’s Check-ins',
    value: '128',
    subtitle: 'Checked in today',
    trend: '12%',
    icon: Users,
    tint: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    title: 'This Week Revenue',
    value: '$4,280',
    subtitle: 'Check-ins & promos',
    trend: '8%',
    icon: DollarSign,
    tint: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    title: 'Active Promotions',
    value: '3',
    subtitle: 'Running right now',
    icon: Gift,
    tint: 'bg-purple-500/10',
    ring: 'ring-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    title: 'Average Rating',
    value: '4.8',
    subtitle: '126 reviews',
    icon: Star,
    tint: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
    iconColor: 'text-amber-400',
  },
]

// Nightly revenue, weekend-heavy - the shape of the real 30d area chart.
const REVENUE_POINTS = [30, 20, 38, 50, 33, 68, 55, 78, 60, 92, 80, 100]

/** Smooth area + line paths across evenly spaced points, in a 100x100 viewBox. */
function buildRevenuePaths(values: number[]) {
  const max = Math.max(...values)
  const coords = values.map((v, i) => ({
    x: (i / (values.length - 1)) * 100,
    y: 100 - (v / max) * 88 - 4,
  }))

  let line = `M ${coords[0].x} ${coords[0].y}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]
    const curr = coords[i]
    const midX = (prev.x + curr.x) / 2
    line += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`
  }

  return { line, area: `${line} L 100 100 L 0 100 Z`, last: coords[coords.length - 1] }
}

const {
  line: REVENUE_LINE,
  area: REVENUE_AREA,
  last: REVENUE_LAST,
} = buildRevenuePaths(REVENUE_POINTS)

function SidebarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-800 bg-gray-900/40 p-1.5">
      <p className="text-[8px] leading-none text-gray-500">{label}</p>
      <p className="mt-1 text-[10px] font-semibold leading-none text-white">{value}</p>
    </div>
  )
}

function CountTile({
  value,
  label,
  accent,
}: {
  value: string
  label: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-1.5',
        accent
          ? 'border-primary/30 bg-primary/10'
          : 'border-gray-700 bg-dark-bg'
      )}
    >
      <p className="text-xl font-bold leading-none tabular-nums text-white">{value}</p>
      <p
        className={cn(
          'mt-1.5 whitespace-nowrap text-[7px] font-medium uppercase tracking-wide leading-none',
          accent ? 'text-primary-light' : 'text-gray-500'
        )}
      >
        {label}
      </p>
    </div>
  )
}

function StatCard({ stat }: { stat: PreviewStat }) {
  const { title, value, subtitle, trend, icon: Icon, tint, ring, iconColor } = stat
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-2.5">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <p className="truncate text-[8px] text-gray-400">{title}</p>
          <p className="mt-2 truncate text-lg font-bold leading-none text-white">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1',
            tint,
            ring
          )}
        >
          <Icon className={cn('h-3 w-3', iconColor)} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        {trend && (
          <span className="flex shrink-0 items-center gap-px text-[7px] font-semibold text-emerald-400">
            <ArrowUpRight className="h-2 w-2" />
            {trend}
          </span>
        )}
        <p className="truncate text-[7px] text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}

/**
 * Fallback for when real tiles cannot load (no VITE_MAPBOX_TOKEN, or no WebGL):
 * a street grid, water and park drawn to match the dark-v11 style. LandingMap
 * renders the actual Mapbox canvas whenever it can, and only falls back here.
 */
function MapCanvas() {
  return (
    <div className="relative h-full min-h-[132px] w-full overflow-hidden bg-[#141414]">
      <svg viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {/* City blocks, for texture under the street grid */}
        <g fill="#191919">
          <rect x="50" y="44" width="46" height="52" rx="2" />
          <rect x="154" y="44" width="46" height="52" rx="2" />
          <rect x="208" y="44" width="40" height="52" rx="2" />
          <rect x="4" y="104" width="38" height="42" rx="2" />
          <rect x="50" y="104" width="46" height="42" rx="2" />
          <rect x="154" y="104" width="46" height="42" rx="2" />
          <rect x="154" y="154" width="46" height="42" rx="2" />
          <rect x="208" y="154" width="40" height="42" rx="2" />
          <rect x="50" y="204" width="46" height="40" rx="2" />
          <rect x="154" y="204" width="46" height="40" rx="2" />
        </g>

        {/* Park */}
        <rect x="6" y="156" width="88" height="38" rx="3" fill="#16281B" />

        {/* Minor streets */}
        <g stroke="#232323" strokeWidth="1.2">
          <path d="M0 22 H300" />
          <path d="M0 60 H300" />
          <path d="M0 128 H300" />
          <path d="M0 176 H300" />
          <path d="M0 224 H300" />
          <path d="M74 0 V260" />
          <path d="M178 0 V260" />
          <path d="M228 0 V260" />
        </g>
        {/* Street grid */}
        <g stroke="#2B2B2B" strokeWidth="2" strokeLinecap="square">
          <path d="M0 40 H300" />
          <path d="M0 100 H300" />
          <path d="M0 150 H300" />
          <path d="M0 200 H300" />
          <path d="M0 248 H300" />
          <path d="M46 0 V260" />
          <path d="M100 0 V260" />
          <path d="M150 0 V260" />
          <path d="M204 0 V260" />
          <path d="M252 0 V260" />
        </g>
        {/* Arterials, plus a diagonal boulevard so it does not read as graph paper */}
        <g stroke="#3A3A3A" strokeWidth="4.5" strokeLinecap="square">
          <path d="M0 118 H300" />
          <path d="M124 0 V260" />
        </g>
        <path d="M20 260 L175 40" stroke="#333333" strokeWidth="3" fill="none" />

        {/* Bay, drawn last so the streets stop at the shoreline */}
        <path d="M232 260 L272 0 L300 0 L300 260 Z" fill="#0F2233" />
        <path d="M232 260 L272 0" stroke="#1B3A4F" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Markers */}
      {MAP_MARKERS.map((m) => (
        <span
          key={`${m.x}-${m.y}`}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-black/40"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            backgroundColor: m.color,
          }}
        >
          {m.count}
        </span>
      ))}

      {/* The operator's own venue, pulsing like PulsingMarker does in-app */}
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: '50%', top: '47%' }}
      >
        <span className="relative flex h-3.5 w-3.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-primary" />
        </span>
      </span>
      <span
        className="absolute -translate-x-1/2 whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 text-[7px] font-medium text-white"
        style={{ left: '50%', top: 'calc(47% + 12px)' }}
      >
        Neon Rooftop
      </span>

    </div>
  )
}

/** Overlaid on whichever map renders - the real Mapbox one or the drawn fallback. */
function MapLegend() {
  return (
    // Top-left: Mapbox puts its logo bottom-left and the attribution
    // bottom-right, and both must stay visible.
    <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex items-center gap-2 rounded bg-black/70 px-1.5 py-1">
      {MAP_LEGEND.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1 text-[7px] text-gray-300">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-wave-border bg-dark-bg shadow-2xl shadow-black/60 ring-1 ring-white/5">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-gray-800 bg-[#101010] px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </span>
        <span className="ml-1 hidden truncate rounded bg-gray-900/70 px-2 py-0.5 text-[8px] text-gray-500 sm:inline">
          wavefinder &middot; /business/dashboard
        </span>
      </div>

      <div className="flex">
        {/* Sidebar - mirrors BusinessSidebar */}
        <aside className="hidden w-[142px] shrink-0 flex-col justify-between border-r border-gray-800 bg-dark-card px-2 py-3 sm:flex">
          <div>
            <div className="mb-3 flex items-center gap-1.5 px-2">
              <Waves className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-[11px] font-bold text-white">WaveFinder</span>
              <span className="rounded bg-secondary/10 px-1 py-px text-[7px] text-secondary">
                Business
              </span>
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
                <div
                  key={label}
                  className={cn(
                    'flex items-center gap-2 rounded px-2 py-[5px] text-[9px]',
                    active ? 'bg-primary/20 font-medium text-primary' : 'text-gray-400'
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </nav>
          </div>

          {/* Business identity + quick stats, as in the real sidebar footer */}
          <div className="mt-3 border-t border-gray-800 pt-2.5">
            <div className="rounded-lg bg-dark-bg/50 p-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                  N
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-medium leading-none text-white">
                    Neon Rooftop
                  </p>
                  <span className="mt-1 flex items-center gap-0.5 text-[8px] font-medium leading-none text-primary">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    Verified
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <SidebarStat label="Today" value="128" />
                <SidebarStat label="Week" value="$4.2k" />
              </div>
            </div>
          </div>
        </aside>

        {/* Console body */}
        <div className="min-w-0 flex-1 p-3">
          {/* Welcome header */}
          <div className="mb-2.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-none text-white">
                Welcome back, Neon Rooftop!
              </p>
              <p className="mt-1.5 text-[8px] leading-none text-gray-400">Friday, Sep 6</p>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 rounded bg-success/15 px-2 py-1 text-[8px] font-medium text-success">
              <BadgeCheck className="h-2.5 w-2.5" />
              Verified
            </span>
          </div>

          {/* Live demand - the "I want to go out" loop, the product's centrepiece */}
          <div className="rounded-xl border border-gray-800 bg-dark-card p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11px] font-semibold leading-none text-white">
                  <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  Live demand
                </p>
                <p className="mt-1.5 truncate text-[8px] leading-none text-gray-400">
                  Hands up within 10 miles, updating every 30 seconds.
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[8px] font-semibold text-white">
                <Send className="h-2.5 w-2.5" />
                Send Wave Offer
              </span>
            </div>

            <div className="mt-2.5 flex items-stretch gap-2">
              <CountTile value="18" label="Hands raised" accent />
              <CountTile value="47" label="People total" />

              {/* What they want */}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 rounded-lg border border-gray-800 bg-dark-bg/60 px-2.5 py-1.5">
                <p className="text-[7px] font-semibold uppercase tracking-wide leading-none text-gray-500">
                  What they want
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {DEMAND_BY_VIBE.map(({ emoji, label, count }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1 rounded-full border border-gray-700 bg-dark-card px-1.5 py-0.5 text-[8px] text-gray-300"
                    >
                      <span aria-hidden>{emoji}</span>
                      {label}
                      <span className="font-semibold tabular-nums text-white">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stat row - the four real dashboard cards */}
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))}
          </div>

          {/* Map + revenue, the real dashboard's lower half */}
          <div className="mt-2 grid gap-2 lg:grid-cols-5">
            {/* Customer check-ins map */}
            <div className="flex flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900/40 lg:col-span-3">
              <div className="flex shrink-0 items-center justify-between gap-2 px-2.5 py-2">
                <p className="truncate text-[10px] font-semibold text-white">
                  Customer Check-ins
                </p>
                <span className="flex shrink-0 items-center gap-1 rounded bg-gray-800/80 px-2 py-0.5 text-[8px] font-medium text-gray-300">
                  <Maximize2 className="h-2 w-2" />
                  View Full Map
                </span>
              </div>
              <div className="relative min-h-[132px] flex-1">
                <LandingMap fallback={<MapCanvas />} />
                <MapLegend />
              </div>
            </div>

            {/* Revenue overview */}
            <div className="flex flex-col rounded-lg border border-gray-800 bg-gray-900/40 p-2.5 lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[10px] font-semibold text-white">Revenue Overview</p>
                <div className="flex shrink-0 items-center gap-1">
                  {['7d', '30d', '90d'].map((p) => (
                    <span
                      key={p}
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[8px] font-medium',
                        p === '30d' ? 'bg-primary text-white' : 'bg-gray-800/80 text-gray-400'
                      )}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-2 text-lg font-bold leading-none tabular-nums text-white">
                $18,940
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-[8px] text-gray-500">
                <span className="flex items-center gap-px font-semibold text-emerald-400">
                  <ArrowUpRight className="h-2 w-2" />
                  14%
                </span>
                vs. previous 30 days
              </p>

              {/* The svg stretches to fill this box, so the marker can be placed
                  with the same percentages the path was built from. */}
              <div className="relative mt-2.5 min-h-[56px] w-full flex-1">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="wf-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={REVENUE_AREA} fill="url(#wf-revenue-fill)" />
                  <path
                    d={REVENUE_LINE}
                    fill="none"
                    stroke="#A29BFE"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <span
                  className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-light ring-2 ring-primary/30"
                  style={{ left: `${REVENUE_LAST.x}%`, top: `${REVENUE_LAST.y}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
