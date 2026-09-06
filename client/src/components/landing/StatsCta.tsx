import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Heart, Phone, Users, Users2 } from 'lucide-react'

const STATS = [
  {
    icon: Users2,
    tint: 'text-wave-blue-light',
    value: '12.4K+',
    label: 'Nearby Reach',
    caption: 'People reached nearby',
  },
  {
    icon: Heart,
    tint: 'text-[#4ADE80]',
    value: '3.2K+',
    label: 'Intent Captured',
    caption: 'People showed interest',
  },
  {
    icon: Users,
    tint: 'text-[#C084FC]',
    value: '1.1K+',
    label: 'Queue Joins',
    caption: 'Joined your queue',
  },
  {
    icon: BadgeCheck,
    tint: 'text-[#FBBF24]',
    value: '780+',
    label: 'Verified Check-Ins',
    caption: 'People showed up',
  },
]

/** Flat skyline silhouette behind the closing CTA, as in the reference design. */
function Skyline() {
  return (
    <svg
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-wave-blue-light/10"
    >
      <path
        fill="currentColor"
        d="M0 160V96h40v-24h28v24h34V60h30v36h26v-52h34v52h30V78h40v82h48v-58h30v-30h26v30h32v58h44v-72h34v-26h24v26h32v72h46v-44h36v44h44v-64h28v-28h26v28h30v64h48v-52h34v-36h26v36h32v52h46v-70h30v-24h26v24h32v70h40v-40h36v40h48v-58h30v-30h26v30h32v58h60z"
      />
    </svg>
  )
}

export function StatsCta() {
  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto space-y-6 px-4">
        {/* Results band */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-wave-border bg-wave-surface/70 px-6 py-10"
        >
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ icon: Icon, tint, value, label, caption }) => (
              <div key={label} className="text-center">
                <Icon className={`mx-auto h-6 w-6 ${tint}`} />
                <p className="mt-3 text-3xl font-bold text-white">{value}</p>
                <p className="mt-1 text-sm font-semibold text-gray-300">{label}</p>
                <p className="mt-1 text-xs text-gray-500">{caption}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[11px] text-gray-600">
            Results from WaveFinder campaigns across all categories.
          </p>
        </motion.div>

        {/* Closing CTA */}
        <div className="relative overflow-hidden rounded-2xl border border-wave-border bg-gradient-to-br from-wave-surface via-wave-bg to-[#0A1533] px-6 py-12 lg:px-12">
          <Skyline />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              Bring more people
              <br />
              <span className="bg-gradient-to-r from-wave-blue-light to-wave-cyan bg-clip-text text-transparent">
                through the door.
              </span>
            </h2>

            <div>
              <p className="text-sm leading-relaxed text-gray-400">
                Start reaching nearby people in real time, fill your queue, and measure
                what matters.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register?role=business"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-wave-blue px-6 text-sm font-semibold text-white transition-colors hover:bg-wave-blue-dark"
                >
                  Sign Up for WaveFinder
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-wave-border bg-wave-surface px-6 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-600 hover:text-white"
                >
                  Talk to Sales
                  <Phone className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
